import React, { useState, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowCounterClockwise,
  Download,
  GraduationCap,
} from "@phosphor-icons/react";
import { chapters } from "../data/chapters";
import questions from "../data/questions.json";
const KEY = "biochemistry-revision-attempts-v1";
function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
export default function Quiz({ onReview }) {
  const [filter, setFilter] = useState("all"),
    [difficulty, setDifficulty] = useState("all"),
    [mode, setMode] = useState("All questions"),
    [index, setIndex] = useState(0),
    [choice, setChoice] = useState(null),
    [submitted, setSubmitted] = useState(false),
    [records, setRecords] = useState(read),
    [session, setSession] = useState(0),
    [done, setDone] = useState(false);
  const pool = useMemo(() => {
    let qs = questions.filter(
      (q) =>
        (filter === "all" || q.chapter === filter) &&
        (difficulty === "all" || q.difficulty === difficulty),
    );
    if (mode === "Review mistakes")
      qs = qs.filter((q) => records[q.id] && !records[q.id].lastCorrect);
    if (mode === "20-question exam") {
      qs = [...qs]
        .sort((a, b) => {
          const hash = (x) =>
            [...x.id].reduce(
              (s, c) => (s * 31 + c.charCodeAt(0) + session) % 100003,
              7,
            );
          return hash(a) - hash(b);
        })
        .slice(0, 20);
    }
    return qs;
  }, [filter, difficulty, mode, session]); // Freeze the session's queue while answers are recorded.
  const q = pool[index];
  const attempted = Object.keys(records).length,
    correct = Object.values(records).filter((r) => r.firstCorrect).length;
  const reset = () => {
    setIndex(0);
    setChoice(null);
    setSubmitted(false);
    setDone(false);
    setSession((x) => x + 1);
  };
  function answer() {
    if (choice === null || submitted) return;
    setSubmitted(true);
    const isCorrect = choice === q.answer;
    const prev = records[q.id];
    const next = {
      ...records,
      [q.id]: {
        attempts: (prev?.attempts || 0) + 1,
        firstCorrect: prev ? prev.firstCorrect : isCorrect,
        lastCorrect: isCorrect,
        lastChoice: choice,
        updatedAt: new Date().toISOString(),
      },
    };
    setRecords(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  function next() {
    if (index + 1 >= pool.length) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setChoice(null);
    setSubmitted(false);
  }
  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { exportedAt: new Date().toISOString(), records },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    a.download = "biochemistry-revision-progress.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  return (
    <div className="quiz-page">
      <div className="quiz-title">
        <span className="eyebrow">RETRIEVAL PRACTICE</span>
        <h1>
          Make understanding
          <br />
          <span>measurable.</span>
        </h1>
        <p>
          165 questions. Eleven chapters. Explanations that connect the answer
          to the mechanism.
        </p>
      </div>
      <div className="quiz-layout">
        <aside className="quiz-sidebar">
          <div className="quiz-progress">
            <GraduationCap size={28} />
            <strong>
              {attempted}
              <small> / 165</small>
            </strong>
            <span>Unique questions attempted</span>
            <div className="progress-track">
              <i style={{ width: `${(attempted / 165) * 100}%` }} />
            </div>
            <span>
              First-attempt accuracy{" "}
              <b>{attempted ? Math.round((correct / attempted) * 100) : 0}%</b>
            </span>
            <button className="text-button" onClick={download}>
              <Download /> Export progress
            </button>
          </div>
          <label>
            Chapter
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                reset();
              }}
            >
              <option value="all">All eleven chapters</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Question level
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                reset();
              }}
            >
              <option value="all">All levels</option>
              {["Recall", "Mechanism", "Application"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Practice mode
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                reset();
              }}
            >
              {["All questions", "20-question exam", "Review mistakes"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
          </label>
          <p className="quiz-provenance">
            Original practice questions based on the supplied lectures. No
            authenticated official NU Oman past papers were found. Progress
            stays in this browser.
          </p>
          <details className="coverage">
            <summary>Chapter coverage</summary>
            {chapters.map((c) => {
              const count = questions.filter(
                (q) => q.chapter === c.id && records[q.id],
              ).length;
              return (
                <div key={c.id}>
                  <span>{c.short}</span>
                  <b>{count}/15</b>
                </div>
              );
            })}
          </details>
        </aside>
        <section className="question-area">
          {!q || done ? (
            <div className="quiz-empty">
              <CheckCircle size={50} />
              <h2>
                {done ? "Session complete." : "No questions in this queue."}
              </h2>
              <p>
                {done
                  ? "Review your missed concepts, then try again after a delay. A score measures this question set; it does not prove complete clinical competence."
                  : "Choose another chapter or practice mode. Correct answers leave the mistakes queue when you start a new session."}
              </p>
              <button className="primary-button" onClick={reset}>
                <ArrowCounterClockwise /> Start a new session
              </button>
            </div>
          ) : (
            <>
              <div className="question-meta">
                <span>
                  {chapters.find((c) => c.id === q.chapter)?.short}{" "}
                  <span className="dot-separator">·</span> {q.difficulty}
                </span>
                <span>
                  {String(index + 1).padStart(2, "0")} / {pool.length}
                </span>
              </div>
              <div className="question-track">
                <i style={{ width: `${((index + 1) / pool.length) * 100}%` }} />
              </div>
              <h2 className="question-stem">{q.stem}</h2>
              <div className="question-options">
                {q.options.map((o, i) => (
                  <button
                    key={o}
                    disabled={submitted}
                    className={`option ${choice === i ? "chosen" : ""} ${submitted && i === q.answer ? "correct" : ""} ${submitted && choice === i && choice !== q.answer ? "wrong" : ""}`}
                    onClick={() => setChoice(i)}
                  >
                    <span>{String.fromCharCode(65 + i)}</span>
                    <div>{o}</div>
                    {submitted && i === q.answer ? (
                      <CheckCircle size={25} />
                    ) : submitted && choice === i ? (
                      <XCircle size={25} />
                    ) : null}
                  </button>
                ))}
              </div>
              {submitted ? (
                <div className="answer-feedback" aria-live="polite">
                  <b>
                    {choice === q.answer
                      ? "Correct."
                      : "The correct answer is " +
                        String.fromCharCode(65 + q.answer) +
                        "."}
                  </b>
                  <p>{q.explanation}</p>
                  <div className="question-citation">
                    {q.source.file}, p. {q.source.page}
                  </div>
                  <button
                    className="text-button"
                    onClick={() => onReview(q.chapter, q.source.page)}
                  >
                    Revisit this concept <ArrowRight />
                  </button>
                  <button
                    className="primary-button next-question"
                    onClick={next}
                  >
                    {index + 1 === pool.length
                      ? "Finish session"
                      : "Next question"}
                    <ArrowRight />
                  </button>
                </div>
              ) : (
                <div className="question-bottom">
                  <span>{q.topic}</span>
                  <button
                    className="primary-button"
                    disabled={choice === null}
                    onClick={answer}
                  >
                    Check answer
                    <ArrowRight />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
