import React, { FunctionComponent, useEffect, useRef } from "react";
import { WordType } from "../App";

interface HistoryProps {
    data: { lastFileWordIndex: number; words: WordType[] };
    categories: { name: string; id: number }[];
}

const History: FunctionComponent<HistoryProps> = ({ data, categories }) => {
    const hisRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (hisRef.current) {
            const childs = [...hisRef.current.children];
            childs[childs.length - 1].scrollIntoView();
        }
    }, [data.words]);

    return (
        <div ref={hisRef} id="history">
            {data.words
                .filter((w) => w.id >= 0)
                .map((word, i) => {
                    const wordCategories = word.categories;
                    if (wordCategories) {
                        if (
                            wordCategories.length !==
                            [...new Set(wordCategories)].length
                        ) {
                            word.categories = [...new Set(wordCategories)];
                        }
                    }
                    return (
                        <React.Fragment key={word.id}>
                            <div className="historyRecord" data-id={word.id}>
                                <span className="historyWordID">
                                    {i}/{word.id}
                                </span>
                                <span className="historyWordName">
                                    {word.word}
                                </span>
                                <span className="historyWordCategories">
                                    {word.status === "finished"
                                        ? word.categories?.map((cat) => {
                                              const category = categories?.find(
                                                  (c) => c.id == cat
                                              );
                                              if (category)
                                                  return (
                                                      <span
                                                          key={category.id}
                                                          className="historyWordCategory"
                                                      >
                                                          {category.name}
                                                      </span>
                                                  );
                                              else return null;
                                          })
                                        : word.status}
                                </span>
                            </div>
                        </React.Fragment>
                    );
                })}
        </div>
    );
};

export default History;
