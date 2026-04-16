import {Stack, Heading, Flex, Text} from '@chakra-ui/react'
import Navbar from '../Navbar/Navbar'
import Display from '../Display/Display'
import Services from '../Services/Services'
import Footer from '../Footer/Footer'


const Hompage = () => {
  return (
    <Stack>
        <Navbar />
        <Display />
        <Services />
        <Footer />
    </Stack>
  )
}

export default Hompage