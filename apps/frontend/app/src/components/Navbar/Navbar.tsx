"use client"

import { useState } from 'react'
import {Box, Flex, Text, IconButton, List, Link, Collapsible, Listbox, createListCollection} from "@chakra-ui/react"
import { GiHamburgerMenu } from "react-icons/gi";
import { LuX, LuChevronDown, LuChevronUp } from "react-icons/lu";


interface NavbarProps{
  onMenu?: (query: string) => void
}

const Navbar = ({ onMenu }: NavbarProps) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showServices, setShowServices] = useState(false)

  const handleToggleMenu = () => {
    setShowMenu(!showMenu)
  }
  const handleToggleServices = () => {
    setShowServices(!showServices)
  }

  const menuOptions = [
    {
      id: 1,
      title: "Services",
      link: "#services"
    },
    {
      id: 2,
      title: "Team",
      link: "#team"
    },
    {
      id: 3,
      title: "Book Appointment",
      link: "#appointment"
    },
  ]

  const services = createListCollection({
  items: [
    { label: "All", value: "all" },
    { label: "Braids", value: "braids" },
    { label: "Training", value: "training" },
    { label: "Lash", value: "lash" },
    { label: "Extras", value: "extras" },
  ],
})


  return (
    <Box 
    as="nav" 
    position="sticky" 
    top="0" 
    left="0"
    right="0"
    bg="white"
    zIndex="60" >
        <Flex 
        justify="space-between" 
        align="center" 
        h="48px" 
        px="2">
            <Text>Loviers Beauty</Text>
            <Box>
              
              <IconButton onClick={handleToggleMenu} 
              aria-label={showMenu ? "Open menu" : "Close menu"}
              variant="ghost">
                {showMenu ? <LuX /> : <GiHamburgerMenu />}
              </IconButton>
                
              
              {showMenu && (
                <List.Root 
                width="220px"
                position="absolute"
                top="45px"
                right="-7px"
                zIndex="60"
                animation="slide-from-top 0.2s ease-in-out"
                unstyled
                bg="white"
                p="4">
                  {menuOptions.map((option) => (
                    <List.Item key={option.id} py="2">
                      {option.title === "Services" ? (
                        <>
                          <Collapsible.Root>
                            <Collapsible.Trigger
                              onClick={handleToggleServices}
                              cursor="pointer"
                              aria-label={showServices ? "Close services menu" : "Open services menu"}>
                              <Flex align="center" gap="2">
                                <Text>{option.title}</Text>
                                {showServices ? <LuChevronUp /> : <LuChevronDown />}
                              </Flex>
                            </Collapsible.Trigger>
                            <Collapsible.Content pl="4">
                              <Listbox.Root 
                              collection={services}
                              unstyled>
                                <Listbox.Label></Listbox.Label>
                                <Listbox.Content>
                                  {services.items.map((service) => (
                                    <Listbox.Item 
                                    item={service} 
                                    key={service.value} 
                                    display="flex"
                                    alignItems="center"
                                    gap="2">
                                      <Listbox.ItemIndicator 
                                      css={{ "& svg": { width: "14px", height: "14px" } }} />
                                      <Listbox.ItemText fontSize="sm">
                                        {service.label}
                                      </Listbox.ItemText>
                                      
                                    </Listbox.Item>
                                  ))}
                                </Listbox.Content>
                              </Listbox.Root>
                            </Collapsible.Content>
                          </Collapsible.Root>
                        </>
                      ):(
                        <Link href={option.link}>
                          {option.title}
                        </Link>
                      )}
                    </List.Item>
                  ))}
                </List.Root>
              )}
              
            </Box>
        </Flex>
    </Box>
  )
}

export default Navbar