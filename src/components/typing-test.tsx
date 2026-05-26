"use client";

import { Moon, RotateCcw, Sun } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { scoreTypingAttempt } from "@/lib/scoring";
import { buildStableWordQueue, buildWordQueue } from "@/lib/word-generator";

const DURATION_OPTIONS = [
  { label: "1 menit", seconds: 60 },
  { label: "3 menit", seconds: 180 },
  { label: "5 menit", seconds: 300 },
] as const;
const WORD_BATCH_SIZE = 140;
const WORD_BUFFER_THRESHOLD = 36;

type TestStatus = "idle" | "running" | "finished";
type DurationSeconds = (typeof DURATION_OPTIONS)[number]["seconds"];
type ThemeMode = "light" | "dark";

export type TypingLanguage = {
  id: string;
  label: string;
  nativeLabel: string;
  words: readonly string[];
};

type TypingTestProps = {
  defaultLanguageId?: string;
  languages: readonly TypingLanguage[];
};

function getTimestamp() {
  return Date.now();
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function hasTypingError(targetWord: string, typedWord: string) {
  return Array.from(typedWord).some(
    (typedCharacter, index) => typedCharacter !== targetWord[index],
  );
}

export function TypingTest({
  defaultLanguageId,
  languages,
}: TypingTestProps) {
  const fallbackLanguage = languages[0];
  const initialLanguageId = defaultLanguageId ?? fallbackLanguage?.id ?? "id";
  const initialWordBank =
    languages.find((language) => language.id === initialLanguageId)?.words ??
    fallbackLanguage?.words ??
    [];
  const [duration, setDuration] = useState<DurationSeconds>(60);
  const [activeLanguageId, setActiveLanguageId] = useState(initialLanguageId);
  const [wordQueue, setWordQueue] = useState<string[]>(() =>
    buildStableWordQueue(initialWordBank, WORD_BATCH_SIZE, initialLanguageId),
  );
  const [submittedWords, setSubmittedWords] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [status, setStatus] = useState<TestStatus>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const inputRef = useRef<HTMLInputElement>(null);

  const elapsedSeconds =
    startedAt === null
      ? 0
      : Math.min(duration, Math.max(0, (now - startedAt) / 1000));
  const remainingSeconds =
    status === "finished" ? 0 : Math.max(0, Math.ceil(duration - elapsedSeconds));
  const currentWordIndex = submittedWords.length;
  const activeLanguage =
    languages.find((language) => language.id === activeLanguageId) ??
    fallbackLanguage;
  const wordBank = activeLanguage?.words ?? [];
  const attemptedWords = useMemo(() => {
    const activeWord = currentInput.trim();
    return activeWord ? [...submittedWords, activeWord] : submittedWords;
  }, [currentInput, submittedWords]);
  const scoreDuration =
    status === "finished" ? duration : Math.max(1, Math.floor(elapsedSeconds));
  const score = scoreTypingAttempt({
    targetWords: wordQueue,
    typedWords: attemptedWords,
    durationSeconds: scoreDuration,
  });
  const visibleStart = Math.max(0, currentWordIndex - 8);
  const visibleWords = wordQueue.slice(visibleStart, visibleStart + 48);
  const isDarkMode = themeMode === "dark";
  const theme = isDarkMode
    ? {
        page: "bg-[#101412] text-teal-50",
        headerBorder: "border-teal-300/25",
        languageText: "text-teal-50",
        languageMuted: "text-teal-100/55",
        toolbarText: "text-teal-50",
        activeButton:
          "bg-teal-100 text-[#102018] shadow-sm ring-1 ring-teal-200/80",
        inactiveButton: "text-teal-50/75 hover:bg-white/10 hover:text-white",
        iconButton: "text-teal-50/80 hover:bg-white/10 hover:text-white",
        timer: "text-teal-50/90",
        wordArea: "text-teal-50/45",
        wordTyped: "text-teal-50",
        wordPending: "text-teal-50/45",
        wrongText: "text-rose-300",
        activeWrong: "border-rose-300 pl-2",
        activeWord: "border-amber-300 pl-2 text-teal-50",
        extraWrong: "bg-rose-300",
        resultBorder: "border-teal-300/25",
        resultGrid: "text-teal-50/65",
      }
    : {
        page: "bg-[#e8f7fb] text-slate-950",
        headerBorder: "border-cyan-300/70",
        languageText: "text-slate-800",
        languageMuted: "text-slate-500",
        toolbarText: "text-slate-800",
        activeButton:
          "bg-white/70 text-slate-950 shadow-sm ring-1 ring-cyan-200",
        inactiveButton: "text-slate-800 hover:bg-white/45 hover:text-slate-950",
        iconButton: "text-slate-800 hover:bg-white/45 hover:text-slate-950",
        timer: "text-slate-800",
        wordArea: "text-slate-500",
        wordTyped: "text-slate-950",
        wordPending: "text-slate-500",
        wrongText: "text-rose-600",
        activeWrong: "border-rose-500 pl-2",
        activeWord: "border-amber-300 pl-2 text-slate-950",
        extraWrong: "bg-rose-500",
        resultBorder: "border-cyan-300/70",
        resultGrid: "text-slate-600",
      };

  useEffect(() => {
    if (status !== "running" || startedAt === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const timestamp = getTimestamp();

      setNow(timestamp);

      if ((timestamp - startedAt) / 1000 >= duration) {
        setStatus("finished");
        window.clearInterval(intervalId);
      }
    }, 200);

    return () => window.clearInterval(intervalId);
  }, [duration, startedAt, status]);

  function focusInput() {
    if (status !== "finished") {
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  function startTest() {
    const timestamp = getTimestamp();
    setStartedAt(timestamp);
    setNow(timestamp);
    setStatus("running");
  }

  function resetTest(nextDuration = duration, nextLanguageId = activeLanguageId) {
    const nextWordBank =
      languages.find((language) => language.id === nextLanguageId)?.words ??
      wordBank;

    setDuration(nextDuration);
    setActiveLanguageId(nextLanguageId);
    setWordQueue(buildWordQueue(nextWordBank, WORD_BATCH_SIZE));
    setSubmittedWords([]);
    setCurrentInput("");
    setStatus("idle");
    setStartedAt(null);
    setNow(getTimestamp());
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }

  function changeDuration(nextDuration: DurationSeconds) {
    setDuration(nextDuration);
    setSubmittedWords([]);
    setCurrentInput("");
    setStatus("idle");
    setStartedAt(null);
    setNow(getTimestamp());
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }

  function submitCurrentWord() {
    const word = currentInput.trim();

    if (!word || status === "finished") {
      return;
    }

    if (status === "idle") {
      startTest();
    }

    const nextWords = [...submittedWords, word];
    setSubmittedWords(nextWords);
    setCurrentInput("");

    if (wordQueue.length - nextWords.length < WORD_BUFFER_THRESHOLD) {
      setWordQueue((queue) => [
        ...queue,
        ...buildWordQueue(wordBank, WORD_BATCH_SIZE),
      ]);
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (status === "finished") {
      return;
    }

    const nextValue = event.target.value.replace(/\s/g, "");

    if (status === "idle" && nextValue.length > 0) {
      startTest();
    }

    setCurrentInput(nextValue);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      submitCurrentWord();
    }
  }

  function getWordClassName(index: number) {
    const absoluteIndex = visibleStart + index;
    const typedWord = submittedWords[absoluteIndex];
    const targetWord = wordQueue[absoluteIndex];
    const isActive = absoluteIndex === currentWordIndex;
    const isActiveWrong =
      isActive && currentInput.length > 0 && hasTypingError(targetWord, currentInput);
    const baseClass =
      "relative inline-flex min-w-0 items-baseline rounded-sm px-0.5 transition-colors duration-150";

    if (typedWord !== undefined) {
      return `${baseClass} ${theme.wordTyped}`;
    }

    if (isActiveWrong) {
      return `${baseClass} border-l-4 ${theme.activeWrong}`;
    }

    if (isActive) {
      return `${baseClass} border-l-4 ${theme.activeWord}`;
    }

    return `${baseClass} ${theme.wordPending}`;
  }

  function renderWord(word: string, index: number) {
    const absoluteIndex = visibleStart + index;
    const isActive = absoluteIndex === currentWordIndex;
    const submittedWord = submittedWords[absoluteIndex];
    const typedWord = submittedWord ?? (isActive ? currentInput : "");

    if (!typedWord) {
      return word;
    }

    return (
      <>
        {Array.from(word).map((character, characterIndex) => {
          const typedCharacter = typedWord[characterIndex];
          const isMissingCharacter =
            submittedWord !== undefined && typedCharacter === undefined;
          const isWrongCharacter =
            typedCharacter !== undefined && typedCharacter !== character;
          const characterClassName =
            isMissingCharacter || isWrongCharacter
              ? theme.wrongText
              : typedCharacter === character
                ? theme.wordTyped
                : theme.wordPending;

          return (
            <span className={characterClassName} key={`${word}-${characterIndex}`}>
              {character}
            </span>
          );
        })}
        {typedWord.length > word.length ? (
          <span
            className={`ml-1 inline-block h-[0.75em] w-1 rounded-full align-baseline ${theme.extraWrong}`}
          />
        ) : null}
      </>
    );
  }

  return (
    <section className={`min-h-screen px-4 py-10 transition-colors duration-300 sm:px-6 lg:px-8 ${theme.page}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className={`border-b pb-6 transition-colors duration-300 ${theme.headerBorder}`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className={`inline-flex h-11 w-fit items-center gap-2 rounded-md px-1 text-sm font-medium ${theme.languageText}`}>
              <span>{activeLanguage?.nativeLabel ?? "Bahasa Indonesia"}</span>
              <span className={theme.languageMuted}>
                ({activeLanguage?.label ?? "indonesian"})
              </span>
            </div>

            <div className={`flex flex-wrap items-center gap-3 text-sm ${theme.toolbarText}`}>
              <div className="flex items-center gap-1">
                {languages.map((language) => (
                  <button
                    className={`h-9 rounded-md px-3 font-medium transition ${
                      activeLanguageId === language.id
                        ? theme.activeButton
                        : theme.inactiveButton
                    }`}
                    key={language.id}
                    onClick={() => resetTest(duration, language.id)}
                    type="button"
                  >
                    {language.id.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    className={`h-9 rounded-md px-3 font-medium transition ${
                      duration === option.seconds
                        ? theme.activeButton
                        : theme.inactiveButton
                    }`}
                    key={option.seconds}
                    onClick={() => changeDuration(option.seconds)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <span className={`w-14 text-center font-medium tabular-nums ${theme.timer}`}>
                {formatTime(remainingSeconds)}
              </span>

              <button
                aria-label={isDarkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition ${theme.iconButton}`}
                onClick={() => setThemeMode(isDarkMode ? "light" : "dark")}
                title={isDarkMode ? "Mode terang" : "Mode gelap"}
                type="button"
              >
                {isDarkMode ? (
                  <Sun aria-hidden="true" size={18} />
                ) : (
                  <Moon aria-hidden="true" size={18} />
                )}
              </button>

              <button
                aria-label="Ulang test"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition ${theme.iconButton}`}
                onClick={() => resetTest()}
                title="Ulang test"
                type="button"
              >
                <RotateCcw aria-hidden="true" size={18} />
              </button>

            </div>
          </div>
        </header>

        <main
          className="min-w-0 outline-none"
          onClick={focusInput}
          onFocus={focusInput}
        >
          <input
            aria-label="Kolom ketik"
            autoComplete="off"
            autoCorrect="off"
            autoFocus
            className="sr-only"
            disabled={status === "finished"}
            id="typing-input"
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={(event) => event.preventDefault()}
            ref={inputRef}
            spellCheck={false}
            value={currentInput}
          />

          <div className={`flex h-[290px] min-w-0 flex-wrap content-start gap-x-3 gap-y-4 overflow-hidden font-serif text-3xl leading-relaxed sm:text-4xl ${theme.wordArea}`}>
            {visibleWords.map((word, index) => (
              <span
                className={getWordClassName(index)}
                key={`${visibleStart + index}-${word}`}
              >
                {renderWord(word, index)}
              </span>
            ))}
          </div>

          <div className={`mt-8 min-h-24 border-t pt-6 transition-colors duration-300 ${theme.resultBorder}`}>
            {status === "finished" ? (
              <div className="grid gap-5 sm:grid-cols-4">
                <ResultStat isDarkMode={isDarkMode} label="KPM" value={score.kpm} />
                <ResultStat
                  isDarkMode={isDarkMode}
                  label="Akurasi"
                  value={`${score.accuracy}%`}
                />
                <ResultStat
                  isDarkMode={isDarkMode}
                  label="Benar"
                  value={score.correctWords}
                />
                <ResultStat isDarkMode={isDarkMode} label="Raw" value={score.rawKpm} />
              </div>
            ) : (
              <div className={`grid max-w-xl grid-cols-3 gap-5 text-sm ${theme.resultGrid}`}>
                <ResultStat isDarkMode={isDarkMode} label="KPM" value={score.kpm} muted />
                <ResultStat
                  isDarkMode={isDarkMode}
                  label="Akurasi"
                  value={`${score.accuracy}%`}
                  muted
                />
                <ResultStat
                  isDarkMode={isDarkMode}
                  label="Benar"
                  value={score.correctWords}
                  muted
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
}

type ResultStatProps = {
  isDarkMode: boolean;
  label: string;
  value: number | string;
  muted?: boolean;
};

function ResultStat({
  isDarkMode,
  label,
  value,
  muted = false,
}: ResultStatProps) {
  const labelClassName = isDarkMode
    ? muted
      ? "text-teal-100/55"
      : "text-teal-100/70"
    : muted
      ? "text-slate-500"
      : "text-slate-600";
  const valueClassName = isDarkMode
    ? muted
      ? "text-2xl text-teal-50/80"
      : "text-4xl text-teal-50"
    : muted
      ? "text-2xl text-slate-700"
      : "text-4xl text-slate-950";

  return (
    <div>
      <dt className={`text-sm font-medium ${labelClassName}`}>
        {label}
      </dt>
      <dd className={`mt-1 font-semibold tabular-nums ${valueClassName}`}>
        {value}
      </dd>
    </div>
  );
}
