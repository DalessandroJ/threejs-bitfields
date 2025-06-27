// simple random helpers
export function randomInt(min, max) {
    if (min > max) [min, max] = [max, min];
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
    if (min > max) [min, max] = [max, min];
    return Math.random() * (max - min) + min;
}

/**
 * Remove any voxel that has all 6 orthogonal neighbors present.
 * @param {Array<{x,y,z,color}>} instances
 * @returns a filtered array with only “surface” voxels
 */
export function cullHiddenVoxels(instances) {
    const keySet = new Set(
        instances.map(({ x, y, z }) => `${x},${y},${z}`)
    );
    const dirs = [
        [1, 0, 0], [-1, 0, 0],
        [0, 1, 0], [0, -1, 0],
        [0, 0, 1], [0, 0, -1]
    ];

    return instances.filter(({ x, y, z }) => {
        // keep this voxel if at least one neighbor is missing
        for (const [dx, dy, dz] of dirs) {
            if (!keySet.has(`${x + dx},${y + dy},${z + dz}`)) {
                return true;
            }
        }
        // all 6 neighbors exist → buried → drop it
        return false;
    });
}