// src/Controls.jsx
import {
    Box,
    VStack,
    HStack,
    Text,
    NumberInput,
    NumberInputField,
    Button
} from '@chakra-ui/react';
import { useState } from 'react';

export default function Controls({ engine }) {
    const [dims, setDims] = useState({ x: 128, y: 256, z: 128 });
    const change = (axis, val) =>
        setDims(d => ({ ...d, [axis]: Math.max(0, +val) }));

    return (
        <Box
            bg="gray.900"
            color="gray.100"
            fontFamily="mono"
            fontSize="sm"
            p={4}
            borderRadius="md"
            boxShadow="sm"
            w="50%"
            boxSizing="border-box"
        >
            <VStack spacing={1}>
                {['x', 'y', 'z'].map(axis => (
                    <HStack key={axis} spacing={3}>
                        <Text w="60px">Grid {axis.toUpperCase()}</Text>
                        <NumberInput
                            value={dims[axis]}
                            min={0}
                            onChange={(_, v) => change(axis, v)}
                            variant="filled"
                            size="sm"
                            w="80px"
                        >
                            <NumberInputField
                                border="none"
                                bg="gray.700"
                                h="26px"
                                _hover={{ bg: 'gray.800' }}
                                _focus={{ bg: 'gray.800' }}
                            />
                        </NumberInput>
                    </HStack>
                ))}

                <VStack spacing={1} w="100%" pt={2}>
                    <Button
                        size="sm"
                        colorScheme="pink"
                        w="100%"
                        onClick={() => engine?.setGridDims(dims)}
                    >
                        Update Grid
                    </Button>
                    <Button size="sm" w="100%" onClick={() => engine?.regenerate()}>
                        Regenerate
                    </Button>
                    <Button size="sm" w="100%" onClick={() => engine?.exportCSV()}>
                        Export .CSV
                    </Button>
                </VStack>
            </VStack>
        </Box>
    );
}
