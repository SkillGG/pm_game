import { useEffect, useState } from "react";
import "./App.css";
import WikiPage from "./WikiPage";
import History from "./History";
import CategoryPicker from "./CategoryPicker";

import cats from "./../../integration/categories.json";
import wtxt from "./../../integration/txt_words.json";
import en_data from "./../../integration/EN_data.json";

export type WordStatus = "skipped" | "dropped" | "finished";

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

    const [[focusedCol, focusedRow], setButtonFocus] = useState<
        [number | null, number | null]
    >([null, null]);

    const focusButton = (col: number | null, row: number | null) => {
        if (!row || !col) return;
        if (row < 0 || col < 0) return;
        const elem = document.querySelector<HTMLElement>(
            `[data-col='${col}'][data-row='${row}']`
        );
        if (elem) {
            elem.focus();
        } else focusButton(col, row - 1);
    };

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
            // console.log("Key pressed down:", e.code);
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
                case "KeyW":
                    if (backTrack > 0) reject();
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
                case "KeyC":
                    (
                        document.querySelector("#pickerform")?.children[0]
                            ?.children[0]
                            ?.nextElementSibling as HTMLLabelElement
                    ).focus?.();
                    break;
                case "ArrowUp":
                    focusButton(focusedCol, focusedRow ? focusedRow - 1 : null);
                    break;
                case "ArrowDown":
                    focusButton(focusedCol, focusedRow ? focusedRow + 1 : null);
                    break;
                case "ArrowLeft":
                    focusButton(focusedCol ? focusedCol - 1 : null, focusedRow);
                    break;
                case "ArrowRight":
                    focusButton(focusedCol ? focusedCol + 1 : null, focusedRow);
                    break;
            }
        };
    }, [newWord, chosenCats, backTrack, word, focusedCol, focusedRow]);

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
        } else if (!(status === "finished" && categories?.length === 0)) {
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
        const index = Words.findIndex(
            (w) => !ENData.words.find((end) => end.word === w)
        );
        ENData.lastFileWordIndex = index;
        saveToFile();
        setWord(Words[ENData.lastFileWordIndex]);
    };

    const addNewWord = (promptWord = "") => {
        const nWord = prompt("New word", promptWord)?.trim();
        if (!nWord) return console.error("User canceled");
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
                    reasonTable.classList.remove("reason-error-already-a-word");
                }, 2000);
            }
        } else {
            setCategoryReasons([]);
            setChosenCats([]);
            setNewWord(true);
            setWord(nWord);
        }
        setBackTrack(0);
    };

    const reject = () => {
        setCategoryReasons([]);
        setChosenCats([]);
        setNewWord(false);
        setBackTrack(0);
        setWord(Words[ENData.lastFileWordIndex]);
    };

    const skip = () => {
        addWord("skipped");
        setCategoryReasons(null);
        setBackTrack(0);
    };

    const drop = () => {
        addWord("dropped");
        setCategoryReasons(null);
        setBackTrack(0);
    };

    useEffect(() => {
        if (!backTrack) return;
        const wrd = ENData.words.find((w) => w.id === backTrack);
        if (wrd) setWord(wrd.word);
    }, [backTrack]);

    const back = () => {
        setBackTrack((p) => {
            console.log(
                ENData.words,
                ENData.words.length,
                ENData.words[ENData.words.length]
            );
            if (!p) return ENData.words[ENData.words.length - 1].id;
            else return p - 1;
        });
        setChosenCats([]);
        setCategoryReasons(null);
    };

    const apply = () => {
        addWord("finished", chosenCats);
        setBackTrack(0);
        setCategoryReasons(null);
    };

    const onButtonFocus = (col: number | null, row: number | null) => {
        setButtonFocus([col, row]);
    };

    useEffect(() => {
        if (word) {
            const wordInDatabase = getFromHistory(word);
            // console.log(previousCategories);
            setEditMode(!!wordInDatabase);
            if (!wordInDatabase) return;
            setCategoryReasons((p) => {
                const reason: [number, string] = [-1, wordInDatabase.status];
                return p ? [...p, reason] : [reason];
            });
            if (wordInDatabase.categoryNumbers) {
                setChosenCats(wordInDatabase.categoryNumbers);
                setCategoryReasons((p) => {
                    if (wordInDatabase.categoryNumbers) {
                        const reasons: [number, string][] =
                            wordInDatabase.categoryNumbers.map((cat) => {
                                return [cat, "Editing"];
                            });
                        return p ? [...p, ...reasons] : [...reasons];
                    } else return p;
                });
            }
        }
    }, [word]);

    const getFromHistory = (
        s: string
    ): {
        status: WordStatus;
        id: number;
        categoryNumbers?: number[];
    } | null => {
        const foundWord = ENData.words.find((c) => c.word == s);
        const cats = foundWord?.categories;
        if (!foundWord) return null;
        else if (foundWord && !cats)
            return {
                status: foundWord.status,
                id: foundWord.id,
            };
        else
            return {
                categoryNumbers: cats,
                id: foundWord.id,
                status: foundWord.status,
            };
    };

    return (
        <>
            {word ? (
                <div id="page" aria-disabled={true}>
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
                        backState={backTrack}
                        forward={reject}
                        categoryReasons={categoryReasons}
                        word={word}
                        back={back}
                        toggleCat={toggleCat}
                        chosenCats={chosenCats}
                        categories={Categories}
                        apply={apply}
                        skip={skip}
                        drop={drop}
                        addWord={() => {
                            addNewWord(window.getSelection()?.toString() || "");
                        }}
                        onButtonFocus={onButtonFocus}
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
