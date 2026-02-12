"use client";

import { useRef, useEffect, useState } from "react";
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
  SimpleGrid,
  Flex,
  Center,
} from "@chakra-ui/react";
import { motion, useInView } from "framer-motion";
import {
  HiOutlineSparkles,
  HiOutlineClipboardDocumentList,
  HiOutlineUserGroup,
  HiOutlineDocumentPlus,
  HiOutlineInboxArrowDown,
  HiOutlineCpuChip,
  HiOutlineHandThumbUp,
  HiOutlineTrophy,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiOutlineArrowRight,
} from "react-icons/hi2";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

const MotionBox = motion.create(Box);
const MotionVStack = motion.create(VStack);
const MotionHeading = motion.create(Heading);
const MotionText = motion.create(Text);
const MotionFlex = motion.create(Flex);

/* ── Scroll-triggered section wrapper ── */
function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <MotionBox
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    >
      {children}
    </MotionBox>
  );
}

/* ── Animated counter ── */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = Math.ceil(value / 30);
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(start);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [isInView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ── How-It-Works step data ── */
const STEPS = [
  { icon: HiOutlineDocumentPlus, label: "Create Event", desc: "Set up your hackathon with custom criteria & weights" },
  { icon: HiOutlineInboxArrowDown, label: "Collect Submissions", desc: "Dynamic forms with 11 field types + file uploads" },
  { icon: HiOutlineCpuChip, label: "AI Assigns Judges", desc: "Archestra.ai distributes submissions fairly" },
  { icon: HiOutlineHandThumbUp, label: "Card-Based Review", desc: "Judges rate with sliders — keyboard shortcuts included" },
  { icon: HiOutlineTrophy, label: "Instant Leaderboard", desc: "Live scores, bias reports, and CSV export" },
];

/* ── Feature card data ── */
const FEATURES = [
  {
    icon: HiOutlineSparkles,
    title: "Dynamic Form Builder",
    desc: "11 field types including file uploads, video links, and rich text. Build forms as powerful as Google Forms.",
  },
  {
    icon: HiOutlineClipboardDocumentList,
    title: "Card-Based Reviews",
    desc: "Judges swipe through submissions with sliders and keyboard shortcuts. ← → to navigate, Ctrl+Enter to submit.",
  },
  {
    icon: HiOutlineUserGroup,
    title: "Smart Judge Assignment",
    desc: "Auto-assign submissions to judges with configurable judges-per-submission. Track progress in real-time.",
  },
  {
    icon: HiOutlineChartBar,
    title: "Live Leaderboard",
    desc: "Weighted scoring aggregation, expandable score breakdowns, and one-click CSV export.",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Bias Detection",
    desc: "Statistical outlier analysis flags judges who score significantly above or below average.",
  },
  {
    icon: HiOutlineBolt,
    title: "AI-Powered Orchestration",
    desc: "Archestra.ai handles judge assignment, score aggregation, and feedback generation via A2A protocol.",
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <Box minH="100vh" bg="gray.900" position="relative" overflow="hidden">
      <Navbar />

      {/* ── Animated gradient background ── */}
      <Box
        position="fixed"
        inset={0}
        zIndex={0}
        pointerEvents="none"
        overflow="hidden"
      >
        <MotionBox
          position="absolute"
          top="-30%"
          left="-15%"
          w="700px"
          h="700px"
          borderRadius="full"
          bg="brand.600"
          filter="blur(140px)"
          opacity={0.12}
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <MotionBox
          position="absolute"
          bottom="-25%"
          right="-15%"
          w="600px"
          h="600px"
          borderRadius="full"
          bg="accent.500"
          filter="blur(140px)"
          opacity={0.08}
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <MotionBox
          position="absolute"
          top="40%"
          left="60%"
          w="400px"
          h="400px"
          borderRadius="full"
          bg="brand.400"
          filter="blur(120px)"
          opacity={0.06}
          animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </Box>

      {/* ===== HERO SECTION ===== */}
      <Container maxW="container.lg" pt={{ base: 16, md: 24 }} pb={20} position="relative" zIndex={1}>
        <MotionVStack
          spacing={8}
          align="center"
          textAlign="center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <MotionBox
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Badge
              fontSize="sm"
              px={4}
              py={1.5}
              borderRadius="full"
              bg="whiteAlpha.100"
              color="brand.300"
              border="1px solid"
              borderColor="brand.500"
              backdropFilter="blur(10px)"
              letterSpacing="wide"
            >
              ✨ AI-Powered Hackathon Judging
            </Badge>
          </MotionBox>

          <MotionHeading
            as="h1"
            fontSize={{ base: "4xl", md: "6xl", lg: "7xl" }}
            fontWeight="800"
            lineHeight="1.05"
            bgGradient="linear(to-r, white, brand.200)"
            bgClip="text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Hackathon Judging,
            <br />
            <Box as="span" bgGradient="linear(to-r, brand.300, accent.300)" bgClip="text">
              Reimagined.
            </Box>
          </MotionHeading>

          <MotionText
            fontSize={{ base: "lg", md: "xl" }}
            color="whiteAlpha.700"
            maxW="640px"
            lineHeight="1.7"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            Create custom submission forms, collect entries, assign judges with AI,
            and get instant leaderboards — all in one beautifully crafted platform.
          </MotionText>

          <MotionBox
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <HStack spacing={4} pt={4}>
              <Button
                size="lg"
                colorScheme="brand"
                px={8}
                fontSize="lg"
                rightIcon={<HiOutlineArrowRight />}
                onClick={() => router.push("/register")}
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "0 10px 40px rgba(124, 58, 237, 0.4)",
                }}
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  _after: {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    w: "200%",
                    h: "100%",
                    bg: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                    animation: "shimmer 3s infinite",
                  },
                  "@keyframes shimmer": {
                    "0%": { left: "-100%" },
                    "100%": { left: "100%" },
                  },
                }}
              >
                Create Your Event
              </Button>
              <Button
                size="lg"
                variant="glass"
                px={8}
                fontSize="lg"
                color="whiteAlpha.800"
                onClick={() => router.push("/login")}
              >
                Sign In
              </Button>
            </HStack>
          </MotionBox>
        </MotionVStack>
      </Container>

      {/* ===== STATS BAR ===== */}
      <Box position="relative" zIndex={1}>
        <Container maxW="container.lg" pb={20}>
          <RevealSection>
            <SimpleGrid
              columns={{ base: 2, md: 4 }}
              gap={6}
              p={8}
              borderRadius="2xl"
              bg="whiteAlpha.50"
              backdropFilter="blur(20px)"
              border="1px solid"
              borderColor="whiteAlpha.100"
            >
              {[
                { value: 11, suffix: "+", label: "Field Types" },
                { value: 5, suffix: "", label: "Scoring Criteria" },
                { value: 100, suffix: "%", label: "Real-Time" },
                { value: 1, suffix: "", label: "Click Export" },
              ].map((stat) => (
                <VStack key={stat.label} spacing={1}>
                  <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="800" color="brand.300">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </Text>
                  <Text fontSize="sm" color="whiteAlpha.600">{stat.label}</Text>
                </VStack>
              ))}
            </SimpleGrid>
          </RevealSection>
        </Container>
      </Box>

      {/* ===== FEATURE CARDS ===== */}
      <Box position="relative" zIndex={1}>
        <Container maxW="container.lg" pb={24}>
          <RevealSection>
            <VStack spacing={4} mb={12} textAlign="center">
              <Badge
                fontSize="xs"
                px={3}
                py={1}
                borderRadius="full"
                bg="brand.500"
                color="white"
                letterSpacing="wider"
                textTransform="uppercase"
              >
                Features
              </Badge>
              <Heading fontSize={{ base: "2xl", md: "4xl" }} color="white">
                Everything you need to run fair judging
              </Heading>
              <Text color="whiteAlpha.600" maxW="500px">
                From form creation to final results — one platform, zero spreadsheets.
              </Text>
            </VStack>
          </RevealSection>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {FEATURES.map((feature, i) => (
              <RevealSection key={feature.title} delay={i * 0.1}>
                <Box
                  p={6}
                  borderRadius="2xl"
                  bg="whiteAlpha.50"
                  backdropFilter="blur(20px)"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  h="full"
                  cursor="default"
                  transition="all 0.3s ease"
                  _hover={{
                    borderColor: "brand.400",
                    boxShadow: "0 0 30px rgba(124, 58, 237, 0.15)",
                    transform: "translateY(-4px)",
                  }}
                >
                  <Flex
                    w={12}
                    h={12}
                    borderRadius="xl"
                    bg="brand.500"
                    align="center"
                    justify="center"
                    mb={4}
                  >
                    <Icon as={feature.icon} boxSize={6} color="white" />
                  </Flex>
                  <Heading size="sm" mb={2} color="white">
                    {feature.title}
                  </Heading>
                  <Text fontSize="sm" color="whiteAlpha.600" lineHeight="1.6">
                    {feature.desc}
                  </Text>
                </Box>
              </RevealSection>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ===== HOW IT WORKS ===== */}
      <Box position="relative" zIndex={1} bg="whiteAlpha.50">
        <Container maxW="container.lg" py={24}>
          <RevealSection>
            <VStack spacing={4} mb={16} textAlign="center">
              <Badge
                fontSize="xs"
                px={3}
                py={1}
                borderRadius="full"
                bg="accent.500"
                color="white"
                letterSpacing="wider"
                textTransform="uppercase"
              >
                How It Works
              </Badge>
              <Heading fontSize={{ base: "2xl", md: "4xl" }} color="white">
                Five steps to hackathon results
              </Heading>
            </VStack>
          </RevealSection>

          <SimpleGrid columns={{ base: 1, md: 5 }} gap={{ base: 8, md: 4 }}>
            {STEPS.map((step, i) => (
              <RevealSection key={step.label} delay={i * 0.12}>
                <VStack spacing={4} textAlign="center" position="relative">
                  {/* Step number */}
                  <Text
                    fontSize="xs"
                    fontWeight="800"
                    color="brand.400"
                    letterSpacing="wider"
                  >
                    STEP {i + 1}
                  </Text>
                  {/* Icon circle */}
                  <Flex
                    w={16}
                    h={16}
                    borderRadius="full"
                    bg="brand.500"
                    align="center"
                    justify="center"
                    boxShadow="0 0 30px rgba(124, 58, 237, 0.3)"
                  >
                    <Icon as={step.icon} boxSize={7} color="white" />
                  </Flex>
                  {/* Connector line (hidden on last) */}
                  {i < STEPS.length - 1 && (
                    <Box
                      display={{ base: "none", md: "block" }}
                      position="absolute"
                      top="50px"
                      left="calc(50% + 40px)"
                      w="calc(100% - 80px)"
                      h="2px"
                      bg="whiteAlpha.200"
                    />
                  )}
                  <Heading size="sm" color="white">
                    {step.label}
                  </Heading>
                  <Text fontSize="xs" color="whiteAlpha.600" lineHeight="1.5">
                    {step.desc}
                  </Text>
                </VStack>
              </RevealSection>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ===== POWERED BY ===== */}
      <Box position="relative" zIndex={1}>
        <Container maxW="container.lg" py={20}>
          <RevealSection>
            <VStack spacing={8} textAlign="center">
              <Text fontSize="sm" color="whiteAlpha.500" letterSpacing="wider" textTransform="uppercase">
                Powered By
              </Text>
              <HStack
                spacing={{ base: 8, md: 16 }}
                flexWrap="wrap"
                justify="center"
                gap={8}
              >
                {[
                  { name: "Archestra.ai", emoji: "🤖", desc: "AI Orchestration" },
                  { name: "Supabase", emoji: "⚡", desc: "Auth & Database" },
                  { name: "Cloudflare R2", emoji: "☁️", desc: "File Storage" },
                  { name: "Next.js", emoji: "▲", desc: "Frontend" },
                  { name: "FastAPI", emoji: "🚀", desc: "Backend" },
                ].map((tech) => (
                  <VStack key={tech.name} spacing={2} minW="100px">
                    <Text fontSize="2xl">{tech.emoji}</Text>
                    <Text fontSize="sm" fontWeight="600" color="whiteAlpha.800">
                      {tech.name}
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.500">
                      {tech.desc}
                    </Text>
                  </VStack>
                ))}
              </HStack>
            </VStack>
          </RevealSection>
        </Container>
      </Box>

      {/* ===== CTA SECTION ===== */}
      <Box position="relative" zIndex={1}>
        <Container maxW="container.md" py={20}>
          <RevealSection>
            <VStack
              spacing={6}
              textAlign="center"
              p={12}
              borderRadius="3xl"
              bg="brand.500"
              bgGradient="linear(to-br, brand.500, brand.700)"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="-50%"
                right="-20%"
                w="400px"
                h="400px"
                borderRadius="full"
                bg="whiteAlpha.100"
                filter="blur(60px)"
              />
              <Heading fontSize={{ base: "2xl", md: "3xl" }} color="white" position="relative">
                Ready to run your hackathon?
              </Heading>
              <Text color="whiteAlpha.800" maxW="400px" position="relative">
                Set up your event in minutes. Invite judges. Get results instantly.
              </Text>
              <Button
                size="lg"
                bg="white"
                color="brand.600"
                px={10}
                fontSize="lg"
                fontWeight="700"
                rightIcon={<HiOutlineArrowRight />}
                onClick={() => router.push("/register")}
                position="relative"
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                  bg: "gray.50",
                }}
              >
                Get Started Free
              </Button>
            </VStack>
          </RevealSection>
        </Container>
      </Box>

      {/* ===== FOOTER ===== */}
      <Box position="relative" zIndex={1} borderTop="1px solid" borderColor="whiteAlpha.100">
        <Container maxW="container.lg" py={8}>
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align="center"
            gap={4}
          >
            <HStack spacing={2}>
              <Text fontSize="lg" fontWeight="800" bgGradient="linear(to-r, white, brand.300)" bgClip="text">
                Juryline
              </Text>
              <Text fontSize="sm" color="whiteAlpha.500">
                Built with ❤️ and Archestra.ai
              </Text>
            </HStack>
            <Text fontSize="xs" color="whiteAlpha.400">
              © {new Date().getFullYear()} Juryline. Hackathon judging, reimagined.
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
