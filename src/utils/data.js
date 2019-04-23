const formatCurveData = (startTime, step) => (curveData) => {
    const datapoints = curveData.rrddata
        .map((d, i) => [d, (startTime + i * step) * 1000])
        .filter((f) => f[0]);

    return {
        target: curveData.title,
        datapoints
    };
};

export {
    formatCurveData
};
