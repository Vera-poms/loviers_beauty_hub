import {Stack, Heading, Flex, Text} from '@chakra-ui/react'
import { FaInstagram } from "react-icons/fa6";
import { AiFillTikTok } from "react-icons/ai";
import { FaWhatsapp } from "react-icons/fa";
// import { montserrat, robotoSerif } from '@/app/font';
import { PiCopyrightLight } from "react-icons/pi";




const Footer = () => {
  return (
    <Stack
    h="150px"
    roundedTop="xl"
    bg="blackAlpha.900"
    color="white"
    display="flex"
    direction="column"
    align="center"
    pt="20px"
    // className={`
    //     ${montserrat.variable}  ${montserrat.className}`}
    >
        <Heading
        // className={`
        // ${robotoSerif.variable} ${robotoSerif.className}`}
        fontSize="10px">
            Visit our social platforms
        </Heading>

        <Flex
        gap="4">
            <FaInstagram />
            <AiFillTikTok />
            <FaWhatsapp />
        </Flex>

        <Text
        fontSize="11px">
            Shop is located at Tabora no. 2.
        </Text>

        <Flex
        fontSize="9px"
        align="center"
        gap="1">
            Copyright <PiCopyrightLight /> 2026
 
        </Flex>
    </Stack>
  )
}

export default Footer