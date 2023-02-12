import { FunctionComponent, useState } from "react";

interface SwitchProps {
    id: number;
    prefix: string;
    label: string;
    chosen: boolean;
    toggleCat(cID: number): void;
    gridRow: number;
    gridCol: number;
    onButtonFocus(col: number, row: number): void;
}

const Switch: FunctionComponent<SwitchProps> = ({
    label,
    id,
    prefix,
    chosen,
    toggleCat,
    gridRow,
    gridCol,
    onButtonFocus,
}) => {
    return (
        <>
            <input
                style={{ display: "none" }}
                name={`${prefix}_${id}`}
                type="checkbox"
                value={id}
                id={`${prefix}_${id}`}
                checked={chosen}
                onChange={() => toggleCat(id)}
            />
            <label
                htmlFor={`${prefix}_${id}`}
                className={`category-switch switch-${chosen ? "on" : "off"}`}
                tabIndex={0}
                data-row={gridRow}
                data-col={gridCol}
                role="button"
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleCat(id);
                }}
                onFocus={() => onButtonFocus(gridCol, gridRow)}
            >
                {label}
            </label>
        </>
    );
};

export default Switch;
