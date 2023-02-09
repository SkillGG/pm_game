import { useEffect, useState } from "react";
import "./App.css";
import WikiPage from "./WikiPage";
import History from "./History";
import CategoryPicker from "./CategoryPicker";

import cats from "./../../integration/categories.json";
import wtxt from "./../../integration/txt_words.json";
import en_data from "./../../integration/EN_data.json";

type WordStatus = "skipped" | "dropped" | "finished";

export type WordType = {
    id: number;
    word: string;
    status: WordStatus;
    categories?: number[] | undefined;
};

const Categories = cats;
const Words = wtxt as string[];
const ENData: {
    lastFileWordIndex: number;
    words: WordType[];
} = en_data as any;

function App() {
    const [word, setWord] = useState(
        Words[ENData.lastFileWordIndex] || undefined
    );

    const [backTrack, setBackTrack] = useState(0);

    const [chosenCats, setChosenCats] = useState<number[]>([]);

    const [networkError, setNetworkError] = useState<string | null>(null);

    const [categoryReasons, setCategoryReasons] = useState<
        [number, string][] | null
    >(null);

    const [newWord, setNewWord] = useState(false);

    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        let newWordFn: () => void;

        if (!newWord) {
            newWordFn = () => {
                const selectedWord = window.getSelection()?.toString() || "";
                addNewWord(selectedWord.trim());
            };
        } else {
            newWordFn = () => {
                reject();
            };
        }

        window.onkeydown = (e: KeyboardEvent) => {
            switch (e.code) {
                case "KeyQ":
                    newWordFn();
                    break;
                case "KeyA":
                    apply();
                    break;
                case "KeyS":
                    skip();
                    break;
                case "KeyD":
                    drop();
                    break;
                case "KeyZ":
                    const btn = document.querySelector(
                        "#backfind-btn"
                    ) as HTMLButtonElement | null;
                    btn?.click();
                    break;
                case "KeyF":
                    back();
                    break;
            }
        };
    }, [newWord]);

    const toggleCat = (catID: number) => {
        if (chosenCats.includes(catID)) {
            setChosenCats((p) => p.filter((f) => f !== catID));
        } else {
            setChosenCats((p) => [...p, catID]);
        }
    };

    const saveToFile = () => {
        fetch("http://localhost:9090/save", {
            method: "POST",
            body: JSON.stringify({ data: JSON.stringify(ENData) }),
        });
    };

    const getNextId = () => ENData.words[ENData.words.length - 1]?.id + 1;

    const addWord = (status: WordStatus, categories?: number[]) => {
        console.log("Adding categories:", categories, "to word", word);
        const catSet = [...new Set(categories)];
        const isAlready = ENData.words.find((w) => w.word === word);
        if (isAlready) {
            isAlready.status = status;
            if (categories) isAlready.categories = categories;
            console.log("Editing word", isAlready);
        } else {
            const nextId = getNextId();
            const wordObject = {
                id: nextId,
                status,
                word: word || "",
                categories: categories ? catSet : undefined,
            };
            console.log("Adding word", wordObject);
            ENData.words.push(wordObject);
        }
        setNewWord(false);
        setChosenCats([]);
        console.log(ENData.lastFileWordIndex, "current wordIndex");
        if (!newWord) ENData.lastFileWordIndex++;
        console.log(ENData.lastFileWordIndex, "next wordIndex");
        saveToFile();
        setWord(Words[ENData.lastFileWordIndex]);
    };

    const addNewWord = (promptWord = "") => {
        const nWord = prompt("New word", promptWord)?.trim();
        if (nWord) {
            if (
                Words.includes(nWord)
                // ENData.words.find((f) => f.word === nWord)
            ) {
                console.error(nWord + " is already a word");
                const reasonTable = document.querySelector(
                    "#reason-table"
                ) as HTMLFormElement | null;
                if (reasonTable) {
                    reasonTable.classList.add("reason-error-already-a-word");
                    reasonTable.dataset.word = nWord;
                    setTimeout(() => {
                        reasonTable.classList.remove(
                            "reason-error-already-a-word"
                        );
                    }, 2000);
                }
            } else {
                setCategoryReasons([]);
                setChosenCats([]);
                setNewWord(true);
                setWord(nWord);
            }
        } else {
            console.error("User canceled");
        }
    };

    const reject = () => {
        setCategoryReasons([]);
        setChosenCats([]);
        setNewWord(false);
        setWord(Words[ENData.lastFileWordIndex]);
    };

    const skip = () => {
        addWord("skipped");
        setCategoryReasons(null);
    };

    const drop = () => {
        addWord("dropped");
        setCategoryReasons(null);
    };

    const back = () => {
        setBackTrack(backTrack + 1);
        setChosenCats([]);
        setWord(Words[ENData.lastFileWordIndex - (backTrack + 1)]);
        setCategoryReasons(null);
    };

    const apply = () => {
        addWord("finished", chosenCats);
        setCategoryReasons(null);
    };

    useEffect(() => {
        if (word) {
            const previousCategories = getFromHistory(word);
            setEditMode(!!previousCategories);
            if (previousCategories) {
                setChosenCats(previousCategories.categoryNumbers);
                setCategoryReasons(
                    previousCategories.categoryNumbers.map((cat) => {
                        return [cat, "Editing"];
                    })
                );
            }
        }
    }, [word]);

    const getFromHistory = (s: string) => {
        const word = ENData.words.find((c) => c.word == s);
        const cats = word?.categories;
        if (!word || !cats) return null;
        else
            return {
                categoryNumbers: cats,
                id: word.id,
            };
    };

    return (
        <>
            {word ? (
                <div id="page">
                    <WikiPage
                        setCategoryReasons={setCategoryReasons}
                        networkError={networkError}
                        setNetworkError={setNetworkError}
                        getFromHistory={getFromHistory}
                        setCategory={(cat: number) => {
                            if (!chosenCats.includes(cat)) toggleCat(cat);
                        }}
                        categories={Categories}
                        word={word}
                        editMode={editMode}
                    />
                    <CategoryPicker
                        editMode={editMode}
                        categoryReasons={categoryReasons}
                        word={word}
                        back={back}
                        toggleCat={toggleCat}
                        chosenCats={chosenCats}
                        categories={Categories}
                        apply={apply}
                        skip={skip}
                        drop={drop}
                        addWord={addNewWord}
                        newWord={newWord}
                        reject={reject}
                    />
                    <History categories={Categories} data={ENData} />
                </div>
            ) : (
                <>Oops! No more words!</>
            )}
        </>
    );
}

export default App;
