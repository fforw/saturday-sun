import React, { useEffect, useState } from "react";
import { usePopper } from 'react-popper';
import cx from "classnames"
import { SketchPicker } from "react-color";


function isParent(elem, target)
{
    let current = target.parentNode;

    while (current)
    {
        if (current === elem)
        {
            return true;
        }

        current = current.parentNode;
    }
    return false;
}


const ColorInput = ({value, onChange, disabled}) => {

    const [open, setOpen] = useState(false)

    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const [arrowElement, setArrowElement] = useState(null);
    const { styles, attributes } = usePopper(
        referenceElement,
        popperElement,
        {
            placement: "right-start",
            modifiers: [
                {
                    name: "arrow",
                    options: { element: arrowElement }
                }
            ],
    });

    useEffect(
        () => {

            if (open)
            {
                const onWindowClick = ev => {

                    if (!isParent(popperElement, ev.target))
                    {
                        setOpen(false);
                    }
                }

                window.addEventListener("click", onWindowClick, true);

                return () => {

                    window.removeEventListener("click", onWindowClick, true);
                }
            }

        },
        [ open ]
    )

    return (
        <div>
            <button
                type="button"
                className="d-inline-block btn btn-secondary"
                ref={setReferenceElement}
                aria-label="Select color"
                aria-haspopup="dialog"
                disabled={ disabled }
                onClick={
                    () => setOpen(!open)
                }
            >
                <div
                    style={{
                        display: "inline-block",
                        width: "3ex",
                        background: `rgb(${value.r},${value.g},${value.b})`
                    }}
                >
                    &nbsp;
                </div>
            </button>
            <div
                className="color-popup"
                ref={setPopperElement}
                role="dialog"
                style={{
                    ...styles.popper,
                    display: open ? "block" : "none"
                }}
                {...attributes.popper}
            >
                <SketchPicker
                    color={ value }
                    onChange={
                        col => onChange(col.rgb)
                    }
                />
                <div ref={setArrowElement} style={styles.arrow} />
            </div>
        </div>
    );
};

export default ColorInput;


const Example = () => {

    return (
        <>
        </>
    );
};
