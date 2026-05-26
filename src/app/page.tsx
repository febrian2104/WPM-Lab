import { TypingTest } from "@/components/typing-test";
import { englishWords } from "@/data/words-en";
import { indonesianWords } from "@/data/words-id";

export default function Home() {
  return (
    <TypingTest
      defaultLanguageId="id"
      languages={[
        {
          id: "id",
          label: "indonesian",
          nativeLabel: "Bahasa Indonesia",
          words: indonesianWords,
        },
        {
          id: "en",
          label: "english",
          nativeLabel: "English",
          words: englishWords,
        },
      ]}
    />
  );
}
