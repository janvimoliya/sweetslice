import React, { useEffect, useState } from 'react'

const TestEffect = () => {
    const [laps, setLaps] = useState([]);
    const [count, setCount] = useState(0);

    const hh = Math.floor(count / 3600);
    const mm = Math.floor((count % 3600) / 60);
    const ss = Math.floor(count % 60);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCount((previous) => previous + 1);
        }, 1000);
        return () => {
            clearTimeout(timer);
        }
    }, [count])

    const addLaps = () => {
        setLaps((s) => [`${hh}:${mm}:${ss}`, ...s]);
    }
    return (
        <div>
            <p>Time: {hh}:{mm}:{ss}</p>
            <button onClick={addLaps} >Record</button>
            {laps.map((lap) => (<p>{lap}</p>))}
        </div>
    )
}

export default TestEffect