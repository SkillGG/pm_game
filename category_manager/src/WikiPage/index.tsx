import React, { FunctionComponent, useEffect, useState } from "react";
import { WordStatus } from "../App";

interface WikiPageProps {
    word: string;
    setCategory(num: number): void;
    categories: { name: string; id: number; keywords?: string[] }[];
    getFromHistory(
        name: string
    ): { categoryNumbers?: number[]; id: number; status: WordStatus } | null;
    setNetworkError(e: string | null): void;
    setCategoryReasons: React.Dispatch<
        React.SetStateAction<[number, string][] | null>
    >;
    networkError: string | null;
    editMode: boolean;
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
    setNetworkError,
    setCategoryReasons,
    networkError,
    getFromHistory,
    editMode,
}) => {
    const [wikiData, setWikiData] = useState<WikiData | undefined>();

    const [useCompatView, setUseCompatView] = useState(true);

    const toggleCompat = () => setUseCompatView((p) => !p);

    const [showPrevious, setShowPrevious] = useState<
        (() => void) | undefined
    >();

    const [abortController, setAbortController] =
        useState<AbortController | null>(null);

    const addReason = (cat: number, reason: string) => {
        setCategoryReasons((prev) => {
            const r: [number, string] = [cat, reason];
            if (prev) {
                if (!prev.find((c) => c[0] === cat && c[1] === reason))
                    return [...prev, r];
                else return prev;
            } else return [r];
        });
    };

    const getRegexForKeyword = (word: string) =>
        new RegExp(`.*?\\b${word}\\b(?:.*)?\\n?`, "i");

    const cleanupWiki = (div: HTMLElement) => {
        div.querySelectorAll("a").forEach((n) => (n.target = "__blank"));
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
            ...querySelectorRemove("[id^='Coordinate_terms']"),
            ...querySelectorRemove("[id^='References']"),
            ...querySelectorRemove("[id^='Statistics']"),
            ...querySelectorRemove("table", false),
            ...querySelectorRemove(".citation-whole", 2),
            ...querySelectorRemove(".thumbinner", 1),
            ...querySelectorRemove(".noprint", false),
            ...querySelectorRemove("link", false),
            ...querySelectorRemove(".mw-empty-elt", false),
            ...querySelectorRemove("figure", false),
            ...querySelectorRemove("ul", false),
        ];
        div.querySelectorAll("a").forEach((a) => {
            if (a.getAttribute("href")?.startsWith("./")) {
                a.href =
                    a
                        .getAttribute("href")
                        ?.replace(/\.\//, "https://en.wiktionary.org/wiki/") ||
                    a.href;
                a.target = "__blank";
            }
        });
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
                addReason(searchCat.id, "Found element with ID " + r?.id);
            }
        });
        categories.forEach((cat) => {
            cat.keywords
                ?.filter((word) => word.charAt(0) === "!")
                .forEach((keyword) => {
                    const wordRegex = getRegexForKeyword(keyword);
                    const regexResult = wordRegex.exec(div.innerText);
                    if (regexResult) {
                        setCategory(cat.id);
                        addReason(cat.id, regexResult[0]);
                    }
                });
        });
        // Elongated form of
        // Alternative form of
        // Alternative spelling of
        // Synonym of
        const ofRegex =
            /(?:plural|form|spelling|synonym|participle|simple|continuous)\s*of\s*([a-\xff ]*).*$/im;
        const findOf = ofRegex.exec(div.innerText);
        if (findOf) {
            setShowPrevious((p) => () => {
                const data = getFromHistory(findOf[1].trim());
                if (
                    data &&
                    data.categoryNumbers &&
                    data.categoryNumbers.length > 0
                ) {
                    data.categoryNumbers.forEach((c) => {
                        setCategory(c);
                        addReason(c, `From ${findOf[1].trim()}`);
                    });
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
        setWikiData({ __html: "Loading", __full_html: "Loading" });
        setShowPrevious(undefined);
        if (abortController) {
            abortController.abort();
            setAbortController(null);
        }
        const controller = new AbortController();
        const signal = controller.signal;
        setAbortController(controller);
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
                    console.error(r.name);
                    if (r.name !== "AbortError")
                        setNetworkError("networkerror");
                    return null;
                });
                if (response && response.status < 300) {
                    const site = (await response.json()) as WikiGetData;
                    let dummyHTMLContainer = document.createElement("div");
                    dummyHTMLContainer.innerHTML = site.html;
                    dummyHTMLContainer
                        .querySelectorAll(".citation-whole")
                        .forEach((cite) => cite.remove());
                    categories.forEach((cat) => {
                        if (cat.keywords) {
                            cat.keywords
                                .filter((word) => word.charAt(0) !== "!")
                                .forEach((keyword) => {
                                    const keywordRegex =
                                        getRegexForKeyword(keyword);
                                    const regexResult = keywordRegex.exec(
                                        dummyHTMLContainer.innerText
                                    );
                                    if (regexResult) {
                                        console.log(
                                            keyword,
                                            " => ",
                                            cat.name,
                                            "\n",
                                            regexResult[0]
                                        );
                                        setCategory(cat.id);
                                        addReason(cat.id, regexResult[0]);
                                    }
                                });
                        }
                    });
                    const seealso =
                        dummyHTMLContainer.querySelector(".disambig-see-also");
                    const type =
                        dummyHTMLContainer.querySelector(
                            "[id^='English']"
                        )?.parentElement;
                    if (type) {
                        type.innerHTML =
                            (type?.innerHTML || "") +
                            "<hr>\n" +
                            (seealso?.innerHTML || "");
                        cleanupWiki(type);
                        setUseCompatView(true);
                    } else {
                        setUseCompatView(false);
                    }
                    const site_taregt_as = document.createElement("div");
                    site_taregt_as.innerHTML = site.html;
                    site_taregt_as
                        .querySelectorAll("a")
                        .forEach((n) => (n.target = "__blank"));
                    const outHTML = type?.innerHTML || "";
                    setWikiData({
                        __html: outHTML,
                        __full_html: site_taregt_as.innerHTML,
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
            <div id="wiki" role="document">
                {editMode && <span id="edit-wiki-badge">Editing</span>}
                <div className="switchview">
                    <button onClick={toggleCompat}>
                        {useCompatView ? "Full" : "Compact"}
                    </button>
                    {showPrevious ? (
                        <button
                            id="backfind-btn"
                            onClick={() => showPrevious()}
                        >
                            Backfind (z)
                        </button>
                    ) : null}
                    <button
                        onClick={() => {
                            window.open(
                                `https://google.com/search?q=wiktionary+${word}`,
                                "_blank"
                            );
                        }}
                    >
                        Google
                    </button>
                    <button
                        onClick={() => {
                            window.open(
                                `https://duckduckgo.com/?q=wiktionary+${word}`,
                                "_blank"
                            );
                        }}
                    >
                        Duckduck
                    </button>
                </div>
                <div id="wikicontent" data-compact={useCompatView}>
                    <h1>{word}</h1>
                    {!wikiData ? (
                        <>
                            {networkError ? (
                                <h2>
                                    There was an error fetching wiktionary site!{" "}
                                    <button>Retry</button>
                                </h2>
                            ) : (
                                <h2>No wiktionary entry for this word!</h2>
                            )}
                        </>
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
