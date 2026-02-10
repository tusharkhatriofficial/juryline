"use client";

import {
    Box,
    Flex,
    HStack,
    Text,
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Badge,
    Avatar,
    IconButton,
    useDisclosure,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerBody,
    DrawerCloseButton,
    VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { HiOutlineBars3, HiOutlineArrowRightOnRectangle } from "react-icons/hi2";
import { useAuth } from "@/hooks/useAuth";

const ROLE_COLORS: Record<string, string> = {
    organizer: "blue",
    judge: "purple",
    participant: "green",
};

export function Navbar() {
    const { user, profile, role, signOut } = useAuth();
    const router = useRouter();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const displayName = profile?.name || user?.user_metadata?.name || "User";
    const initial = displayName.charAt(0).toUpperCase();
    const roleColor = ROLE_COLORS[role || ""] || "gray";

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    if (!user) {
        return (
            <Box
                as="nav"
                position="sticky"
                top={0}
                zIndex={100}
                bg="whiteAlpha.50"
                backdropFilter="blur(20px)"
                borderBottom="1px solid"
                borderColor="whiteAlpha.100"
            >
                <Flex
                    maxW="container.xl"
                    mx="auto"
                    px={6}
                    py={3}
                    align="center"
                    justify="space-between"
                >
                    <Text
                        fontSize="xl"
                        fontWeight="800"
                        cursor="pointer"
                        onClick={() => router.push("/")}
                        bgGradient="linear(to-r, white, brand.300)"
                        bgClip="text"
                    >
                        Juryline
                    </Text>
                    <HStack spacing={3}>
                        <Button
                            size="sm"
                            variant="ghost"
                            color="whiteAlpha.800"
                            onClick={() => router.push("/login")}
                        >
                            Log In
                        </Button>
                        <Button
                            size="sm"
                            colorScheme="brand"
                            onClick={() => router.push("/register")}
                        >
                            Sign Up
                        </Button>
                    </HStack>
                </Flex>
            </Box>
        );
    }

    return (
        <Box
            as="nav"
            position="sticky"
            top={0}
            zIndex={100}
            bg="whiteAlpha.50"
            backdropFilter="blur(20px)"
            borderBottom="1px solid"
            borderColor="whiteAlpha.100"
        >
            <Flex
                maxW="container.xl"
                mx="auto"
                px={6}
                py={3}
                align="center"
                justify="space-between"
            >
                <Text
                    fontSize="xl"
                    fontWeight="800"
                    cursor="pointer"
                    onClick={() => router.push("/dashboard")}
                    bgGradient="linear(to-r, white, brand.300)"
                    bgClip="text"
                >
                    Juryline
                </Text>

                {/* Desktop menu */}
                <HStack spacing={4} display={{ base: "none", md: "flex" }}>
                    <Badge
                        colorScheme={roleColor}
                        fontSize="xs"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        textTransform="capitalize"
                    >
                        {role}
                    </Badge>

                    <Menu>
                        <MenuButton>
                            <HStack spacing={2} cursor="pointer">
                                <Avatar size="sm" name={displayName} bg="brand.500" color="white" />
                                <Text fontSize="sm" color="whiteAlpha.800" fontWeight="500">
                                    {displayName}
                                </Text>
                            </HStack>
                        </MenuButton>
                        <MenuList bg="gray.800" borderColor="whiteAlpha.200">
                            <MenuItem
                                bg="gray.800"
                                _hover={{ bg: "whiteAlpha.100" }}
                                icon={<HiOutlineArrowRightOnRectangle />}
                                onClick={handleSignOut}
                            >
                                Log Out
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>

                {/* Mobile hamburger */}
                <IconButton
                    display={{ base: "flex", md: "none" }}
                    aria-label="Menu"
                    icon={<HiOutlineBars3 />}
                    variant="ghost"
                    color="whiteAlpha.800"
                    onClick={onOpen}
                />

                <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
                    <DrawerOverlay />
                    <DrawerContent bg="gray.900">
                        <DrawerCloseButton color="whiteAlpha.800" />
                        <DrawerBody pt={12}>
                            <VStack spacing={4} align="stretch">
                                <HStack>
                                    <Avatar size="sm" name={displayName} bg="brand.500" color="white" />
                                    <Box>
                                        <Text fontWeight="600" color="white">{displayName}</Text>
                                        <Badge colorScheme={roleColor} fontSize="xs" textTransform="capitalize">
                                            {role}
                                        </Badge>
                                    </Box>
                                </HStack>
                                <Button
                                    variant="ghost"
                                    color="whiteAlpha.800"
                                    justifyContent="flex-start"
                                    onClick={handleSignOut}
                                    leftIcon={<HiOutlineArrowRightOnRectangle />}
                                >
                                    Log Out
                                </Button>
                            </VStack>
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>
            </Flex>
        </Box>
    );
}
