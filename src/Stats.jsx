// src/Stats.jsx
import { Box, Text, Stack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

export default function Stats({ engine }) {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (!engine) return;
        const id = setInterval(() => setStats(engine.getStats()), 500);
        return () => clearInterval(id);
    }, [engine]);

    if (!stats) return null;

    return (
        <Box
            bg="gray.900"
            color="gray.100"
            fontFamily="mono"
            fontSize="sm"
            p={4}
            borderRadius="md"
            boxShadow="sm"
            w="auto"
        >
            <Stack spacing={0}>
                <Text><strong>Palette:</strong> {stats.paletteName}</Text>
                <Text>
                    <strong>Voxel Count:</strong>{' '}
                    {(stats.instanceCnt ?? 0).toLocaleString()}
                </Text>
                <Text>
                    <strong>States:</strong> {stats.transparent} transparent, {stats.filled} filled, {stats.totalStates} total
                </Text>
            </Stack>
        </Box>
    );
}
