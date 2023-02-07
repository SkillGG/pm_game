import { useState } from "react";
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
const ENData: { lastEditID: number; words: WordType[] } = en_data as any;

function App() {
    const [word, setWord] = useState(Words[ENData.lastEditID] || undefined);

    const [chosenCats, setChosenCats] = useState<number[]>([]);

    const [history, setHistory] = useState<[string, number[] | undefined][]>(
        []
    );

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

    const addWord = (status: WordStatus, categories?: number[]) => {
        console.log("Adding categories:", categories);
        const catSet = [...new Set(categories)];
        const isAlready = ENData.words.find(
            (w) => w.word.toLowerCase() == word
        );
        if (isAlready) {
            isAlready.status = status;
            if (categories) isAlready.categories = categories;
        } else {
            if (categories)
                ENData.words.push({
                    id: ENData.lastEditID,
                    status,
                    word: word || "",
                    categories: catSet,
                });
            else
                ENData.words.push({
                    id: ENData.lastEditID,
                    status,
                    word: word || "",
                });
        }
        setChosenCats([]);
        ENData.lastEditID = ENData.words[ENData.words.length - 1].id + 1;
        saveToFile();
        setWord(Words[ENData.lastEditID]);
    };

    const skip = () => {
        addWord("skipped");
    };

    const drop = () => {
        addWord("dropped");
    };

    const back = () => {
        ENData.lastEditID--;
        setChosenCats([]);
        setWord(Words[ENData.lastEditID]);
    };

    const apply = () => {
        addWord("finished", chosenCats);
    };

    return (
        <>
            {word ? (
                <div id="page">
                    <WikiPage
                        getFromHistory={(s: string) => {
                            const word = ENData.words.find(
                                (c) => c.word.toLowerCase() == s.toLowerCase()
                            );
                            const cats = word?.categories;
                            if (!word || !cats) return null;
                            else
                                return {
                                    categoryNumbers: cats,
                                    id: word.id,
                                };
                        }}
                        setCategory={(cat: number) => {
                            if (!chosenCats.includes(cat)) toggleCat(cat);
                        }}
                        categories={Categories}
                        word={word}
                    />
                    <CategoryPicker
                        word={word}
                        back={back}
                        toggleCat={toggleCat}
                        chosenCats={chosenCats}
                        categories={Categories}
                        apply={apply}
                        skip={skip}
                        drop={drop}
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
