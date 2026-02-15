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
import { motion, useInView, AnimatePresence } from "framer-motion";
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
  HiOutlineSquares2X2,
  HiOutlineCloudArrowUp,
  HiOutlineCodeBracket,
  HiOutlineArrowTrendingUp,
  HiOutlineServerStack,
} from "react-icons/hi2";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

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
  { icon: HiOutlineDocumentPlus, label: "Create Event", desc: "Set up criteria, weights, and custom submission forms" },
  { icon: HiOutlineUserGroup, label: "Invite Judges", desc: "Share a magic link to onboard your judging panel instantly" },
  { icon: HiOutlineInboxArrowDown, label: "Collect Entries", desc: "Participants submit projects via your custom form" },
  { icon: HiOutlineCpuChip, label: "Auto-Assign", desc: "Agents intelligently distribute workload across judges" },
  { icon: HiOutlineTrophy, label: "Export Winners", desc: "Download final ranked results as a CSV in one click" },
];

/* ── Feature card data ── */
const FEATURES = [
  {
    icon: HiOutlineUserGroup,
    title: "Judge Invite Links",
    desc: "Scale your panel in seconds. Generate a unique magic link, share it, and watch judges onboard themselves instantly.",
  },
  {
    icon: HiOutlineCpuChip,
    title: "Smart Load Balancing",
    desc: "No more manual assignment. Archestra agents distribute submissions evenly across your judge panel automatically.",
  },
  {
    icon: HiOutlineClipboardDocumentList,
    title: "Custom Scoring Rubrics",
    desc: "Define your own criteria and weights. creating a standardized framework for fair and consistent evaluation.",
  },
  {
    icon: HiOutlineChartBar,
    title: "Real-Time Leaderboard",
    desc: "Watch scores roll in live. See who's winning and export the final results to CSV with a single click.",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Bias Detection",
    desc: "Statistical analysis flags judges who are consistently scoring too high or too low compared to the average.",
  },
  {
    icon: HiOutlineSparkles,
    title: "AI Feedback Synthesis",
    desc: "Give every participant valuable feedback. Agents synthesize judge comments into constructive advice automatically.",
  },
];

/* ── Rotating Flow Steps for Hero ── */
const FLOW_STEPS = [
  {
    icon: HiOutlineDocumentPlus,
    title: "Create Event",
    subtitle: "Criteria & weights",
    color: "brand.400",
    bgColor: "brand.500",
    mockLines: ["Event: Global AI Hackathon", "Criteria: Innovation (1.5x)", "Judges needed: 15"],
  },
  {
    icon: HiOutlineUserGroup,
    title: "Invite Panel",
    subtitle: "Magic link sharing",
    color: "accent.400",
    bgColor: "accent.500",
    mockLines: ["Generating invite link...", "juryline.com/invite/8x92m", "12 judges joined \u2705"],
  },
  {
    icon: HiOutlineInboxArrowDown,
    title: "Collect Entries",
    subtitle: "Dynamic forms",
    color: "blue.400",
    bgColor: "blue.500",
    mockLines: ["Team Alpha submitted", "Team Beta submitted", "Validation: Passed \u2705"],
  },
  {
    icon: HiOutlineCpuChip,
    title: "Load Balancing",
    subtitle: "Orchestration",
    color: "purple.400",
    bgColor: "purple.500",
    mockLines: ["Distributing 150 entries...", "Judge load: 10 each", "Assignments complete \u2705"],
  },
  {
    icon: HiOutlineTrophy,
    title: "Final Results",
    subtitle: "Export to CSV",
    color: "yellow.400",
    bgColor: "yellow.500",
    mockLines: ["#1 Team Beta (9.2)", "#2 Team Alpha (8.9)", "Exporting results.csv..."],
  },
];

function RotatingFlowCard() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % FLOW_STEPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Handle hot-reload case where activeStep might exceed new array length
  const step = FLOW_STEPS[activeStep] || FLOW_STEPS[0];

  useEffect(() => {
    if (activeStep >= FLOW_STEPS.length) {
      setActiveStep(0);
    }
  }, [activeStep]);

  return (
    <Box position="relative" w="full" maxW="420px">
      {/* Progress dots */}
      <HStack spacing={2} justify="center" mb={4}>
        {FLOW_STEPS.map((_, i) => (
          <Box
            key={i}
            w={activeStep === i ? "24px" : "8px"}
            h="8px"
            borderRadius="full"
            bg={activeStep === i ? "brand.400" : "whiteAlpha.200"}
            transition="all 0.4s ease"
            cursor="pointer"
            onClick={() => setActiveStep(i)}
          />
        ))}
      </HStack>

      {/* Card */}
      <Box
        borderRadius="2xl"
        bg="whiteAlpha.50"
        backdropFilter="blur(20px)"
        border="1px solid"
        borderColor="whiteAlpha.100"
        overflow="hidden"
        minH="280px"
      >
        <AnimatePresence mode="wait">
          <MotionBox
            key={activeStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Header bar */}
            <Flex
              px={5}
              py={3}
              bg="whiteAlpha.50"
              borderBottom="1px solid"
              borderColor="whiteAlpha.100"
              align="center"
              gap={3}
            >
              <Flex
                w={9}
                h={9}
                borderRadius="lg"
                bg={step.bgColor}
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={step.icon} boxSize={5} color="white" />
              </Flex>
              <Box>
                <Text fontSize="sm" fontWeight="700" color="white">
                  Step {activeStep + 1}: {step.title}
                </Text>
                <Text fontSize="xs" color="whiteAlpha.500">
                  {step.subtitle}
                </Text>
              </Box>
              <Badge
                ml="auto"
                fontSize="9px"
                px={2}
                py={0.5}
                borderRadius="full"
                bg={step.bgColor}
                color="white"
              >
                {activeStep + 1}/{FLOW_STEPS.length}
              </Badge>
            </Flex>

            {/* Mock terminal/content */}
            <Box px={5} py={4}>
              <Box
                bg="gray.900"
                borderRadius="lg"
                p={4}
                border="1px solid"
                borderColor="whiteAlpha.100"
                fontFamily="mono"
              >
                {/* Terminal header dots */}
                <HStack spacing={1.5} mb={3}>
                  <Box w="6px" h="6px" borderRadius="full" bg="red.400" />
                  <Box w="6px" h="6px" borderRadius="full" bg="yellow.400" />
                  <Box w="6px" h="6px" borderRadius="full" bg="green.400" />
                  <Text fontSize="9px" color="whiteAlpha.300" ml={2}>
                    juryline
                  </Text>
                </HStack>

                {step.mockLines.map((line, i) => (
                  <MotionBox
                    key={`${activeStep}-${i}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.15, duration: 0.3 }}
                  >
                    <Text
                      fontSize="xs"
                      color={i === step.mockLines.length - 1 ? step.color : "whiteAlpha.700"}
                      lineHeight="2"
                      fontFamily="mono"
                      whiteSpace="pre"
                    >
                      {line}
                    </Text>
                  </MotionBox>
                ))}
              </Box>

              {/* Animated progress bar */}
              <Box mt={3} h="3px" borderRadius="full" bg="whiteAlpha.100" overflow="hidden">
                <MotionBox
                  h="full"
                  bg={step.bgColor}
                  borderRadius="full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3.5, ease: "linear" }}
                  key={activeStep}
                />
              </Box>
            </Box>
          </MotionBox>
        </AnimatePresence>
      </Box>
    </Box>
  );
}

/* ── Tech stack with icons ── */
const TECH_STACK = [
  { name: "Archestra.ai", icon: HiOutlineCpuChip, desc: "AI Orchestration" },
  { name: "Supabase", icon: HiOutlineServerStack, desc: "Auth & Database" },
  { name: "Cloudflare R2", icon: HiOutlineCloudArrowUp, desc: "File Storage" },
  { name: "Next.js", icon: HiOutlineCodeBracket, desc: "Frontend" },
  { name: "FastAPI", icon: HiOutlineArrowTrendingUp, desc: "Backend" },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

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

      {/* ===== HERO SECTION -- Split Layout ===== */}
      <Container maxW="container.xl" pt={{ base: 16, md: 20 }} pb={16} position="relative" zIndex={1}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          align="center"
          justify="space-between"
          gap={{ base: 12, lg: 16 }}
        >
          {/* Left -- Text Content */}
          <MotionBox
            flex={1}
            maxW={{ lg: "540px" }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <VStack spacing={6} align={{ base: "center", lg: "flex-start" }} textAlign={{ base: "center", lg: "left" }}>
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
                <HStack spacing={2} display="inline-flex">
                  <Icon as={HiOutlineShieldCheck} boxSize={3.5} />
                  <Text as="span">The End of Spreadsheet Chaos</Text>
                </HStack>
              </Badge>

              <Heading
                as="h1"
                fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                fontWeight="800"
                lineHeight="1.05"
                bgGradient="linear(to-r, white, brand.200)"
                bgClip="text"
                position="relative"
              >
                Fair Judging,{" "}
                <Box as="span" bgGradient="linear(to-r, brand.300, accent.300)" bgClip="text">
                  Zero Friction.
                </Box>
              </Heading>

              <Text
                fontSize={{ base: "lg", md: "xl" }}
                color="whiteAlpha.700"
                lineHeight="1.7"
                maxW="560px"
              >
                Stop forcing judges to switch between demos, forms, and spreadsheets.
                Juryline unifies everything into a single, immersive view.
              </Text>

              <HStack spacing={4} pt={2}>
                {user ? (
                  <Button
                    size="lg"
                    colorScheme="brand"
                    color="white"
                    px={8}
                    fontSize="lg"
                    rightIcon={<HiOutlineArrowRight />}
                    onClick={() => router.push("/dashboard")}
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 40px rgba(124, 58, 237, 0.4)",
                    }}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      colorScheme="brand"
                      color="white"
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
                          bg: "linear-gradient(90deg, transparent, rgba(255,b255,255,0.15), transparent)",
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
                  </>
                )}
              </HStack>
            </VStack>
          </MotionBox>

          {/* Right -- Rotating Flow Animation */}
          <MotionBox
            flex={1}
            display="flex"
            justifyContent="center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          >
            <RotatingFlowCard />
          </MotionBox>
        </Flex>
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
                { value: 99, suffix: "+", label: "Scoring Criteria" },
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
                {TECH_STACK.map((tech) => (
                  <VStack key={tech.name} spacing={2} minW="100px">
                    <Icon as={tech.icon} boxSize={7} color="brand.300" />
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
                onClick={() => router.push(user ? "/dashboard" : "/register")}
                position="relative"
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                  bg: "gray.50",
                }}
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
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
                Built with love by Tushar Khatri
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
