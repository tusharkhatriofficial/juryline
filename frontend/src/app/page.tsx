"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  HiOutlineSparkles,
  HiOutlineClipboardDocumentList,
  HiOutlineUserGroup,
} from "react-icons/hi2";

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

export default function Home() {
  return (
    <Box minH="100vh" bg="gray.900" position="relative" overflow="hidden">
      {/* Gradient background orbs */}
      <Box
        position="absolute"
        top="-20%"
        left="-10%"
        w="600px"
        h="600px"
        borderRadius="full"
        bg="brand.600"
        filter="blur(120px)"
        opacity={0.15}
      />
      <Box
        position="absolute"
        bottom="-20%"
        right="-10%"
        w="500px"
        h="500px"
        borderRadius="full"
        bg="accent.500"
        filter="blur(120px)"
        opacity={0.1}
      />

      <Container maxW="container.lg" py={20} position="relative" zIndex={1}>
        <MotionVStack
          spacing={8}
          align="center"
          textAlign="center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Badge */}
          <Badge
            colorScheme="brand"
            fontSize="sm"
            px={4}
            py={1}
            borderRadius="full"
            bg="brand.500"
            color="white"
          >
            Hackathon Judging, Reimagined
          </Badge>

          {/* Hero heading */}
          <Heading
            as="h1"
            fontSize={{ base: "4xl", md: "6xl", lg: "7xl" }}
            fontWeight="800"
            lineHeight="1.1"
            bgGradient="linear(to-r, white, brand.200)"
            bgClip="text"
          >
            Build Forms.
            <br />
            Collect Submissions.
            <br />
            Judge Smarter.
          </Heading>

          {/* Subtitle */}
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            color="whiteAlpha.700"
            maxW="600px"
          >
            Create custom submission forms like Google Forms, invite judges, and
            review submissions with a beautiful card-based UI — all in one
            platform.
          </Text>

          {/* CTA Buttons */}
          <HStack spacing={4} pt={4}>
            <Button
              size="lg"
              colorScheme="brand"
              px={8}
              fontSize="lg"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "0 10px 40px rgba(124, 58, 237, 0.3)",
              }}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="glass"
              px={8}
              fontSize="lg"
              color="whiteAlpha.800"
            >
              Learn More
            </Button>
          </HStack>

          {/* Feature cards */}
          <HStack
            spacing={6}
            pt={16}
            flexWrap="wrap"
            justify="center"
            gap={6}
          >
            {[
              {
                icon: HiOutlineSparkles,
                title: "Dynamic Form Builder",
                desc: "11 field types. Drag-and-drop. Google Forms-style.",
              },
              {
                icon: HiOutlineClipboardDocumentList,
                title: "Card-Based Reviews",
                desc: "Judges swipe through submissions with keyboard shortcuts.",
              },
              {
                icon: HiOutlineUserGroup,
                title: "Smart Assignment",
                desc: "Auto-assign submissions to judges. Track progress live.",
              },
            ].map((feature, i) => (
              <MotionBox
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                p={6}
                borderRadius="2xl"
                bg="whiteAlpha.50"
                backdropFilter="blur(20px)"
                border="1px solid"
                borderColor="whiteAlpha.100"
                maxW="280px"
                textAlign="left"
                _hover={{
                  borderColor: "brand.400",
                  boxShadow: "0 0 20px rgba(124, 58, 237, 0.15)",
                  transform: "translateY(-4px)",
                }}
                transition="all 0.3s ease"
                cursor="default"
              >
                <Icon
                  as={feature.icon}
                  boxSize={8}
                  color="brand.400"
                  mb={3}
                />
                <Heading size="sm" mb={2} color="white">
                  {feature.title}
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.600">
                  {feature.desc}
                </Text>
              </MotionBox>
            ))}
          </HStack>
        </MotionVStack>
      </Container>
    </Box>
  );
}
