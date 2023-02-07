import { FunctionComponent, useState } from "react";

interface SwitchProps {
    id: number;
    prefix: string;
    label: string;
    chosen: boolean;
    toggleCat(cID: number): void;
}

const Switch: FunctionComponent<SwitchProps> = ({
    label,
    id,
    prefix,
    chosen,
    toggleCat
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
            >
                {label}
            </label>
        </>
    );
};

export default Switch;
