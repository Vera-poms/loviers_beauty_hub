import {Stack} from '@chakra-ui/react'
import Navbar from '../Navbar/Navbar'
import Display from '../Display/Display'
import Services from '../Services/Services'
import Footer from '../Footer/Footer'


const Hompage = () => {
  return (
    <Stack
    minH="100vh"
    
    justify="space-between"
    >
      <Stack gap="0">
        <Navbar />
        <Display />
        <Services />
      </Stack>
      <Footer />
    </Stack>
  )
}

export default Hompage