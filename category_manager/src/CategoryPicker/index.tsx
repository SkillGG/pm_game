import React, { FunctionComponent, useEffect, useRef } from "react";
import Switch from "./Switch";

interface CategoryPickerProps {
    word: string;
    categories: { id: number; name: string }[];
    skip(): void;
    drop(): void;
    back(): void;
    apply(): void;
    reject(): void;
    addWord(): void;
    editMode: boolean;
    newWord: boolean;
    chosenCats: number[];
    toggleCat(catID: number): void;
    categoryReasons: [number, string][] | null;
}

const CategoryPicker: FunctionComponent<CategoryPickerProps> = ({
    categories,
    chosenCats,
    toggleCat,
    skip,
    drop,
    back,
    addWord,
    newWord,
    reject,
    apply,
    editMode,
    categoryReasons,
}) => {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <div id="picker" className={`${editMode ? "edit-picker" : ""}`}>
            <form id="pickerform" ref={formRef}>
                {categories.map((cat) => {
                    return (
                        <React.Fragment key={`${cat.id}_${cat.name}`}>
                            <div>
                                <Switch
                                    label={cat.name}
                                    prefix="cat"
                                    toggleCat={toggleCat}
                                    chosen={chosenCats.includes(cat.id)}
                                    id={cat.id}
                                />
                            </div>
                        </React.Fragment>
                    );
                })}
            </form>
            <button
                id="apply-btn"
                onClick={() => {
                    if (formRef.current) {
                        const data = [...new FormData(formRef.current)];
                        const values = data.map((value) =>
                            parseInt(value[1] as string, 10)
                        );
                        apply();
                    }
                }}
            >
                Save (a)
            </button>
            <button id="skip-btn" onClick={skip}>
                Skip (s)
            </button>
            <button id="drop-btn" onClick={drop}>
                Drop (d)
            </button>
            <button id="back-btn" onClick={back}>
                Back (f)
            </button>
            {newWord ? (
                <button onClick={reject}>Reject word (q)</button>
            ) : (
                <button onClick={addWord}>Add new word (q)</button>
            )}
            <div id="reason-table">
                <table>
                    <tbody>
                        {categoryReasons?.map((reason) => {
                            const categoryName = categories.find(
                                (cid) => cid.id === reason[0]
                            )?.name;
                            return (
                                <tr
                                    key={`${reason[0]}_${reason[1]}`}
                                    className="cat-reason"
                                >
                                    {categoryName ? (
                                        <>
                                            <td>{categoryName}</td>
                                            <td> {reason[1]}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td colSpan={2}>{reason[1]}</td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CategoryPicker;
