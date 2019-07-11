const getHostTags = (target) => {
    const hostTags = {};

    for(let i = 0; i <= 2; i++) {
        if(target[`filter${i}value`] != null && target[`filter${i}value`] != '') {
            hostTags[`host_tag_${i}_grp`] = target[`filter${i}group`];
            hostTags[`host_tag_${i}_op`] = target[`filter${i}op`];
            hostTags[`host_tag_${i}_val`] = target[`filter${i}value`];
        }
    }

    return hostTags;
};

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
    getHostTags,
    formatCurveData
};
