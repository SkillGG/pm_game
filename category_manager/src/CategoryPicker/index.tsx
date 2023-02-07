import React, { FunctionComponent, useRef } from "react";
import Switch from "./Switch";

interface CategoryPickerProps {
    word: string;
    categories: { id: number; name: string }[];
    skip(): void;
    drop(): void;
    back(): void;
    apply(): void;
    chosenCats: number[];
    toggleCat(catID: number): void;
}

const CategoryPicker: FunctionComponent<CategoryPickerProps> = ({
    categories,
    chosenCats,
    toggleCat,
    skip,
    drop,
    back,
    apply,
}) => {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <div id="picker">
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
                onClick={() => {
                    if (formRef.current) {
                        const data = [...new FormData(formRef.current)];
                        const values = data.map((value) =>
                            parseInt(value[1] as string, 10)
                        );
                        console.log(values);
                        apply();
                    }
                }}
            >
                Save
            </button>
            <button onClick={skip}>Skip</button>
            <button onClick={drop}>Drop</button>
            <button onClick={back}>Back</button>
        </div>
    );
};

export default CategoryPicker;
