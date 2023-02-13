import React, { useRef } from "react";
import Switch from "./Switch";

interface CategoryPickerProps {
    word: string;
    categories: { id: number; name: string }[];
    skip(): void;
    drop(): void;
    back(): void;
    apply(): void;
    reject(): void;
    forward(): void;
    addWord(): void;
    editMode: boolean;
    backState: number;
    newWord: boolean;
    chosenCats: number[];
    toggleCat(catID: number): void;
    onButtonFocus(col: number, row: number): void;
    categoryReasons: [number, string][] | null;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
    categories,
    chosenCats,
    toggleCat,
    skip,
    drop,
    back,
    addWord,
    forward,
    newWord,
    reject,
    backState,
    apply,
    editMode,
    categoryReasons,
    onButtonFocus,
}) => {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <div id="picker" className={`${editMode ? "edit-picker" : ""}`}>
            <div className="picker-info">(c) to focus on buttons</div>
            <form id="pickerform" ref={formRef}>
                {categories.map((cat, i) => {
                    return (
                        <React.Fragment key={`${cat.id}_${cat.name}`}>
                            <div>
                                <Switch
                                    gridCol={(i % 3) + 1}
                                    gridRow={Math.trunc(i / 3) + 1}
                                    label={cat.name}
                                    prefix="cat"
                                    toggleCat={toggleCat}
                                    chosen={chosenCats.includes(cat.id)}
                                    id={cat.id}
                                    onButtonFocus={onButtonFocus}
                                />
                            </div>
                        </React.Fragment>
                    );
                })}
            </form>
            <div className="picker-buttons">
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
                {backState >= 0 ? (
                    <button id="back-btn" onClick={back}>
                        Back (f)
                    </button>
                ) : null}
                {backState !== 0 ? (
                    <button id="forward-btn" onClick={forward}>
                        Forward (w)
                    </button>
                ) : null}
                {newWord ? (
                    <button onClick={reject}>Reject word (q)</button>
                ) : (
                    <button onClick={addWord}>Add new word (q)</button>
                )}
            </div>
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
