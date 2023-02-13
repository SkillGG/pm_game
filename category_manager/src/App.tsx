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

    /**
     * @returns txt_words.json index of the earliest non-added word
     */
    const getNewestWordIndex = () => {
        const index = Words.findIndex(
            (w) => !ENData.words.find((end) => end.word === w)
        );
        return index;
    };

    const [word, setWord] = useState(Words[getNewestWordIndex()] || undefined);

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

    const [activeElementState, setActiveElementState] = useState(
        document.activeElement
    );

    /**
     * This function puts focus on the category button
     * @param col column of the button to focus
     * @param row row of the button to focus
     * @returns
     */
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

    /**
     * Change buttonFocus when given button got focused
     * @param col column of the button
     * @param row row of the button
     */
    const onButtonFocus = (col: number | null, row: number | null) => {
        setButtonFocus([col, row]);
    };

    /**
     * It clicks the button with given selector if the button is present in the DOM
     * @param selector CSS selector of the button
     * @returns undefined
     */
    const clickButtonWithSelector = (selector: string) =>
        document.querySelector<HTMLButtonElement>(`${selector}`)?.click();

        /**
         * Return active element's innerText
         * @returns innerText of the activeElement if it's an anchor
         */
    const getActiveWordText = () => {
        if (document.activeElement && document.activeElement.nodeName === "A")
            return (document.activeElement as HTMLAnchorElement).innerText;
    };

    /**
     * Loads the number into current window (wiki + editmode)
     * @param newWord word to load
     * @param bt backTrack number
     */
    const loadWord = (newWord: string, bt: number) => {
        setWord(newWord);
        setChosenCats([]);
        setCategoryReasons([]);
        setBackTrack(bt);
    };

    /**
     * Enter edit word with given word
     * @param w word to edit
     */
    const editWord = (w: string) => {
        if (ENData.words.find((x) => x.word === w)) {
            loadWord(w, -1);
        }
    };

    /**
     * Enter edit mode with currently focused word
     */
    const editFocusedWord = () => {
        if (document.activeElement && document.activeElement.nodeName === "A")
            editWord((document.activeElement as HTMLAnchorElement).innerText);
    };

    /**
     * setChosenCats + setCategoryReasons shorthand
     * @param catID category ID to switch
     * @param reason reason for given category
     */
    const chooseCategoryWithReason = (catID: number, reason: string) => {
        const reasonArr: [number, string] = [catID, reason];
        setChosenCats((p) => [...p, catID]);
        setCategoryReasons((p) => (p ? [...p, reasonArr] : [reasonArr]));
    };

    /**
     * Copy categories from given word
     * @param copyWord word to copy categories from
     */
    const copyCategoriesFromWord = (copyWord: string) => {
        const copyData = getFromHistory(copyWord);
        if (copyWord && copyData && copyData.status === "finished")
            copyData.categoryNumbers?.forEach((cat) =>
                chooseCategoryWithReason(cat, `Copied from ${copyWord}`)
            );
    };

    /**
     * Update the window.onkeyydown and window.onkeyup listeners when state/active element changes 
     */
    useEffect(() => {
        let newWordFn: () => void = () => {};
        if (!newWord) {
            newWordFn = () =>
                addNewWord(
                    window.getSelection()?.toString() || getActiveWordText()
                );
        } else {
            newWordFn = () => reject();
        }

        window.onkeyup = (e) => {
            setActiveElementState(document.activeElement);
        };

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
                case "KeyE":
                    editFocusedWord();
                    break;
                case "KeyD":
                    drop();
                    break;
                case "KeyW":
                    if (backTrack !== 0) reject();
                    break;
                case "KeyZ":
                    clickButtonWithSelector("#backfind-btn");
                    break;
                case "KeyG":
                    clickButtonWithSelector("#search-google");
                    break;
                case "KeyR":
                    clickButtonWithSelector("#search-duckduck");
                    break;
                case "KeyF":
                    back();
                    break;
                case "KeyC":
                    if (!e.ctrlKey) focusButton(1, 1);
                    else {
                        const fW = getActiveWordText();
                        if (fW) copyCategoriesFromWord(fW);
                    }
                    break;
                case "KeyX":
                    clickButtonWithSelector("#wiki-show-full");
                    break;
                case "ArrowUp":
                    if (!e.shiftKey)
                        focusButton(
                            focusedCol,
                            focusedRow ? focusedRow - 1 : null
                        );
                    break;
                case "ArrowDown":
                    if (!e.shiftKey)
                        focusButton(
                            focusedCol,
                            focusedRow ? focusedRow + 1 : null
                        );
                    break;
                case "ArrowLeft":
                    if (!e.shiftKey)
                        focusButton(
                            focusedCol ? focusedCol - 1 : null,
                            focusedRow
                        );
                    break;
                case "ArrowRight":
                    if (!e.shiftKey)
                        focusButton(
                            focusedCol ? focusedCol + 1 : null,
                            focusedRow
                        );
                    break;
            }
        };
    }, [newWord, chosenCats, backTrack, word, focusedCol, focusedRow]);

    /**
     * Toggle state of the category
     * @param catID category to toggle
     */
    const toggleCat = (catID: number) => {
        if (chosenCats.includes(catID)) {
            setChosenCats((p) => p.filter((f) => f !== catID));
        } else {
            setChosenCats((p) => [...p, catID]);
        }
    };

    /**
     * Send data to api to save to file
     */
    const saveToFile = () => {
        fetch("http://localhost:9090/save", {
            method: "POST",
            body: JSON.stringify({ data: JSON.stringify(ENData) }),
        });
    };

    /**
     * Return a free id in the {ENData.words} list  
     * @returns id of the last added word
     */
    const getNextId = () => ENData.words[ENData.words.length - 1]?.id + 1;

    /**
     * Add a new word to ENData.words
     * @param status status of the word
     * @param categories categories to add to a word
     */
    const addWord = (status: WordStatus, categories?: number[]) => {
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
        ENData.lastFileWordIndex = getNewestWordIndex();
        saveToFile();
        setNewWord(false);
        loadWord(Words[ENData.lastFileWordIndex], 0);
    };

    /**
     * Add new word outside of the txt_words.json file
     * @param promptWord default prompt value
     */
    const addNewWord = (promptWord = "") => {
        const nWord = prompt("New word", promptWord)?.trim();
        if (!nWord) return console.error("User canceled");
        if (
            Words.includes(nWord) ||
            ENData.words.find((f) => f.word === nWord)
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
            loadWord(nWord, 0);
            setNewWord(true);
        }
    };

    /**
     * reject new word addition / backtrack state / edit mode
     */
    const reject = () => {
        if (editMode) ENData.lastFileWordIndex = getNewestWordIndex();
        loadWord(Words[ENData.lastFileWordIndex], 0);
        setNewWord(false);
    };

    /**
     * Set status to skipped
     */
    const skip = () => {
        addWord("skipped");
    };

    /**
     * Set status to dropped
     */
    const drop = () => {
        addWord("dropped");
    };

    /**
     * Go back when backtrack changes
     */
    useEffect(() => {
        if (!backTrack) return;
        const wrd = ENData.words.find((w) => w.id === backTrack);
        if (wrd) setWord(wrd.word);
    }, [backTrack]);

    /**
     * Go back to previous words from ENData.words
     */
    const back = () => {
        setBackTrack((p) => {
            if (!p) return ENData.words[ENData.words.length - 1].id;
            else return p - 1;
        });
        setChosenCats([]);
        setCategoryReasons(null);
    };

    /**
     * Save categories for given word
     */
    const apply = () => {
        addWord("finished", chosenCats);
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
                wordInDatabase.categoryNumbers.forEach((catId) => {
                    chooseCategoryWithReason(catId, `From database ${word}`);
                });
            }
        }
        focusButton(1, 1);
    }, [word]);

    useEffect(() => {
        focusButton(1, 1);
    }, []);

    /**
     * Get information about the word from ENData.word 
     * @param s word to search in history
     * @returns a status and categories of the word from ENData.words
     */
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
                        editFocused={editFocusedWord}
                        word={word}
                        editMode={editMode}
                        activeElement={activeElementState}
                    />
                    <CategoryPicker
                        editMode={editMode}
                        backState={backTrack}
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
                        forward={reject}
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
