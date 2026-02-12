"use client";

import {
    Box,
    Flex,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    Icon,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
    HiOutlineDocumentText,
    HiOutlineLockClosed,
    HiOutlineArrowRight,
    HiOutlineUserPlus,
    HiOutlineSparkles,
} from "react-icons/hi2";
import { useRouter, usePathname } from "next/navigation";

const MotionBox = motion.create(Box);

export function SubmissionAuthGate() {
    const router = useRouter();
    const pathname = usePathname();
    const returnTo = encodeURIComponent(pathname);

    return (
        <Box minH="100vh" bg="gray.900" position="relative" overflow="hidden">
            {/* Background decoration */}
            <Box
                position="absolute"
                top="20%"
                left="50%"
                transform="translateX(-50%)"
                w="600px"
                h="600px"
                borderRadius="full"
                bg="brand.600"
                filter="blur(160px)"
                opacity={0.1}
            />

            <Flex minH="100vh" align="center" justify="center" p={6}>
                <MotionBox
                    maxW="480px"
                    w="full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <VStack spacing={8} textAlign="center">
                        {/* Lock icon */}
                        <MotionBox
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.2, type: "spring" }}
                        >
                            <Flex
                                w={20}
                                h={20}
                                borderRadius="2xl"
                                bg="whiteAlpha.50"
                                border="1px solid"
                                borderColor="whiteAlpha.100"
                                align="center"
                                justify="center"
                                backdropFilter="blur(10px)"
                            >
                                <Icon as={HiOutlineLockClosed} boxSize={9} color="brand.300" />
                            </Flex>
                        </MotionBox>

                        {/* Messaging */}
                        <VStack spacing={3}>
                            <Heading fontSize="2xl" color="white" fontWeight="700">
                                Account required to submit
                            </Heading>
                            <Text color="whiteAlpha.600" fontSize="md" maxW="380px" lineHeight="1.7">
                                You need to create a free account or sign in before you can submit your project to this event.
                            </Text>
                        </VStack>

                        {/* Why card */}
                        <Box
                            w="full"
                            p={5}
                            borderRadius="xl"
                            bg="whiteAlpha.50"
                            border="1px solid"
                            borderColor="whiteAlpha.100"
                        >
                            <VStack spacing={3} align="start">
                                <Text fontSize="xs" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider" fontWeight="600">
                                    Why do I need an account?
                                </Text>
                                {[
                                    { icon: HiOutlineDocumentText, text: "Track and edit your submissions" },
                                    { icon: HiOutlineSparkles, text: "Get notified about review results" },
                                    { icon: HiOutlineUserPlus, text: "Join multiple hackathon events" },
                                ].map((item, i) => (
                                    <HStack key={i} spacing={3}>
                                        <Icon as={item.icon} boxSize={4} color="brand.300" />
                                        <Text fontSize="sm" color="whiteAlpha.700">
                                            {item.text}
                                        </Text>
                                    </HStack>
                                ))}
                            </VStack>
                        </Box>

                        {/* Actions */}
                        <VStack spacing={3} w="full">
                            <Button
                                size="lg"
                                colorScheme="brand"
                                color="white"
                                w="full"
                                rightIcon={<HiOutlineArrowRight />}
                                onClick={() => router.push(`/register?returnTo=${returnTo}`)}
                                _hover={{
                                    transform: "translateY(-1px)",
                                    boxShadow: "0 8px 30px rgba(124, 58, 237, 0.35)",
                                }}
                            >
                                Create Free Account
                            </Button>
                            <Button
                                size="lg"
                                variant="ghost"
                                color="whiteAlpha.700"
                                w="full"
                                onClick={() => router.push(`/login?returnTo=${returnTo}`)}
                                _hover={{ color: "white", bg: "whiteAlpha.50" }}
                            >
                                I already have an account
                            </Button>
                        </VStack>
                    </VStack>
                </MotionBox>
            </Flex>
        </Box>
    );
}
