import { FunctionComponent, useEffect, useState } from "react";

interface WikiPageProps {
    word: string;
    setCategory(num: number): void;
    categories: { name: string; id: number; keywords?: string[] }[];
    getFromHistory(
        name: string
    ): { categoryNumbers: number[]; id: number } | null;
}

type WikiData = {
    __html: string;
    __full_html: string;
};

type WikiGetData = {
    id: number;
    key: string;
    title: string;
    latest: { id: number; timestamp: string };
    html: string;
};

const WikiPage: FunctionComponent<WikiPageProps> = ({
    word,
    setCategory,
    categories,
    getFromHistory,
}) => {
    const [wikiData, setWikiData] = useState<WikiData | undefined>();

    const [useCompatView, setUseCompatView] = useState(true);

    const toggleCompat = () => setUseCompatView((p) => !p);

    const [showPrevious, setShowPrevious] = useState<
        (() => void) | undefined
    >();

    const [abortController, setAbortController] =
        useState<AbortController | null>(null);

    const cleanupWiki = (div: HTMLElement) => {
        const sections = div.querySelectorAll("[data-mw-section-id]");
        const querySelectorRemove = (
            str: string,
            parent: boolean | number = true
        ) => {
            const all = div.querySelectorAll(str);
            return [...all].map((r) => {
                if (typeof parent === "boolean") {
                    return parent ? r?.parentElement : r;
                } else {
                    let x: Element | null = r;
                    for (let i = 0; i < parent; i++) {
                        x = r?.parentElement;
                    }
                    return x;
                }
            });
        };
        const toRemove = [
            ...querySelectorRemove(".sister-wikipedia", false),
            ...querySelectorRemove("[id^='Alternative_forms']"),
            // ...querySelectorRemove("[id^='Etymology']"),
            ...querySelectorRemove("[id^='Pronunciation']"),
            ...querySelectorRemove("[id^='Usage_notes']"),
            ...querySelectorRemove("[id^='Translations']"),
            ...querySelectorRemove("[id^='Derived_terms']"),
            ...querySelectorRemove("[id^='Further_reading']"),
            ...querySelectorRemove("[id^='Notes']"),
            ...querySelectorRemove("[id^='Related_terms']"),
            ...querySelectorRemove("[id^='Hyponyms']"),
            ...querySelectorRemove("[id^='Conjugation']"),
            ...querySelectorRemove("[id^='Synonyms']"),
            ...querySelectorRemove("[id^='Antonyms']"),
            ...querySelectorRemove("[id^='Anagrams']"),
            ...querySelectorRemove("[id^='See_also']"),
            ...querySelectorRemove("[id^='References']"),
            ...querySelectorRemove(".citation-whole", 2),
            ...querySelectorRemove(".thumbinner", 1),
            ...querySelectorRemove(".noprint", false),
            ...querySelectorRemove(".mw-empty-elt", false),
            ...querySelectorRemove("figure", false),
        ];
        toRemove.forEach((el) => {
            if (el) {
                el.remove();
            }
        });
        querySelectorRemove("[id]", false).forEach((r) => {
            const searchName = r?.id.split("_")[0];
            const searchCat = categories.find(
                (c) => c.name.toLowerCase() == searchName?.toLowerCase()
            );
            if (searchCat) {
                setCategory(searchCat.id);
            }
        });
        // Elongated form of
        // Alternative form of
        // Alternative spelling of
        // Synonym of
        const ofRegex =
            /(?:plural|form|spelling|synonym)\s*of\s*(.*?)\.?\s*$/im;
        const findOf = ofRegex.exec(div.innerText);
        if (findOf) {
            setShowPrevious((p) => () => {
                const data = getFromHistory(findOf[1]);
                if (data && data.categoryNumbers.length > 0) {
                    data.categoryNumbers.forEach((c) => setCategory(c));
                    const div = document.querySelector(
                        `[data-id="${data.id}"]`
                    ) as HTMLDivElement;
                    if (div) {
                        div.style.color = "red";
                        div.scrollIntoView();
                        setTimeout(() => {
                            div.style.color = "";
                        }, 2000);
                    }
                }
            });
        }
        return div;
    };

    useEffect(() => {
        setShowPrevious(undefined);
        if (abortController) {
            abortController.abort();
            setAbortController(null);
        }

        const controller = new AbortController();
        const signal = controller.signal;
        setAbortController(controller);
        setWikiData({ __html: "Loading", __full_html: "Loading" });
        const fn = async () => {
            const ACCESSTOKEN = import.meta.env.VITE_ACCESS_TOKEN;
            if (ACCESSTOKEN) {
                // word = "John"
                let url = `https://api.wikimedia.org/core/v1/wiktionary/en/page/${word}/with_html`;
                let response = await fetch(url, {
                    headers: {
                        Authorization: "Bearer " + ACCESSTOKEN,
                        "Api-User-Agent":
                            "pm_category_manager (skilletssgames@gmail.com)",
                    },
                    signal: signal,
                }).catch((r) => {
                    console.log(r);
                    return null;
                });
                if (response && response.status < 300) {
                    const site = (await response.json()) as WikiGetData;
                    console.log(site);
                    let dummyHTMLContainer = document.createElement("div");
                    dummyHTMLContainer.innerHTML = site.html;
                    categories.forEach((cat) => {
                        if (cat.keywords) {
                            cat.keywords.forEach((keyword) => {
                                if (
                                    new RegExp(`\\b${keyword}\\b`, "i").exec(
                                        dummyHTMLContainer.innerText
                                    )
                                ) {
                                    setCategory(cat.id);
                                }
                            });
                        }
                    });
                    const type =
                        dummyHTMLContainer.querySelector(
                            "[id^='English']"
                        )?.parentElement;

                    if (type) {
                        cleanupWiki(type);
                        setUseCompatView(true);
                    } else {
                        setUseCompatView(false);
                    }
                    const outHTML =
                        type?.innerHTML.replace(
                            /<a rel="mw:WikiLink" href="\.\/(.*)"/g,
                            `<a rel="mw:WikiLink" href="https://en.wiktionary.org/wiki/$1" target="_blank"`
                        ) || "";
                    setWikiData({
                        __html: outHTML,
                        __full_html: site.html,
                    });
                } else {
                    setWikiData(undefined);
                }
            } else {
                console.error("No accesstoken!", ACCESSTOKEN);
            }
        };
        if (word) {
            fn();
            return () => {
                controller.abort();
                setAbortController(null);
            };
        }
    }, [word]);

    return (
        <>
            <div id="wiki">
                <button className="switchview" onClick={toggleCompat}>
                    {useCompatView ? "Full" : "Compact"}
                </button>
                {showPrevious && (
                    <button
                        className="switchview"
                        onClick={() => showPrevious()}
                    >
                        Backfind
                    </button>
                )}
                <button
                    className="switchview"
                    onClick={() => {
                        window.open(
                            `https://google.com/search?q=wiktionary+${word}`,
                            "_blank"
                        );
                    }}
                >
                    Google
                </button>{" "}
                <button
                    className="switchview"
                    onClick={() => {
                        window.open(
                            `https://duckduckgo.com/?q=wiktionary+${word}`,
                            "_blank"
                        );
                    }}
                >
                    Duckduck
                </button>
                <div id="wikicontent">
                    <h1>{word}</h1>
                    {!wikiData ? (
                        <h2>No wiktionary entry for this word!</h2>
                    ) : (
                        <div
                            dangerouslySetInnerHTML={
                                useCompatView
                                    ? wikiData
                                    : { __html: wikiData.__full_html }
                            }
                        ></div>
                    )}
                </div>
            </div>
        </>
    );
};

export default WikiPage;
