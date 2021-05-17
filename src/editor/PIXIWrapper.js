import React, { memo, useEffect, useRef } from "react"
import cx from "classnames"


const PIXIWrapper = memo(({ element, ... props}) => {

    const ref = useRef(null);

    useEffect(
        () => {

            ref.current.appendChild(element);

            return () => {
                if (ref.current)
                {
                    ref.current.removeChild(element);
                }
            }

        },
        [ element ]
    )

    return (
        <div ref={ ref }{ ... props } >
        </div>
    );
});

export default PIXIWrapper;
