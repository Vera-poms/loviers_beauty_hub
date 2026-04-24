import {useState, useMemo, useEffect} from 'react'
import {
    PasswordInput,
    PasswordStrengthMeter
} from '../../components/ui/password-input'
import {useForm, type SubmitHandler} from 'react-hook-form'
import {signup, login} from '../../api/client'
import {Box, Button, Field, Input, Heading, Stack, Text, SimpleGrid, Flex} from '@chakra-ui/react'
import {type Options, passwordStrength} from 'check-password-strength'
import {useSearchParams, useNavigate} from 'react-router-dom'
import {jwtDecode} from 'jwt-decode'

interface FormValues {
    username: string;
    email: string;
    password: string;
    role: "admin";
}

const strengthOptions: Options<string> = [
    {id: 1, value: "weak", minDiversity: 0, minLength: 0},
    {id: 2, value: "medium", minDiversity: 2, minLength: 6},
    {id: 3, value: "strong", minDiversity: 3, minLength: 8},
    {id: 4, value: "very-strong", minDiversity: 4, minLength: 10},
]

const Signup = () => {
    const navigate = useNavigate()
    const [isUser, setIsUser] = useState(false)
    const [statusMessage, setStatusMessage] = useState<{text: string, type: "error" | "success"} | null>(null)
    const [searchParams] = useSearchParams();
    const showAdminOption = searchParams.get("admin") === "true"
    const availableRole = useMemo(() => {
        if (showAdminOption){
            return "admin"
        }
    }, [showAdminOption])

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isValid }
    } = useForm<FormValues>({
        defaultValues: {
            username: "",
            email: "",
            password: "",
            role: availableRole
        }
    })
    const value = watch("password", "")
    const showMessage = (text: string, type: "error" | "success") => {
        setStatusMessage({text, type})
        setTimeout(() => setStatusMessage(null), 5000)
    }
    
    const toggleMode = () => {
        setIsUser(!isUser)
        reset()
    }

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try{
            if (isUser) {
                await signup(data.username, data.email, data.password, data.role)
            }
            const result = await login(data.email, data.password)
            const decode: any = jwtDecode(result.access_token)
            const role = decode.role
            localStorage.setItem("access_token", result.access_token)
            localStorage.setItem("role", role)

            showMessage("Success! Redirecting to login...", "success")
            setTimeout(() => navigate("/admin/dashboard"), 2000)
        } catch (error: any) {
            const status = error.response?.status
            const detail = error.response?.data?.detail
            const errorMessage = typeof detail === "string" ? detail :  detail?.message || error.message
            if (status === 422 || status === 401){
                showMessage("Invalid email or password. Please try again.", "error")
                return
            }
            showMessage(`Auth error: ${errorMessage}`, "error")
        }
    }

    useEffect(() => {
        const token = localStorage.getItem("access_token")
        if(token){
            try{
                const decode: any = jwtDecode(token)
                const currentTime = Date.now() / 1000
                if (decode.exp < currentTime){
                    localStorage.clear()
                    showMessage("Session expired. Please log in again.", "error")
                }else{
                    navigate("/admin/dashboard")
                }
            }catch(error){
                localStorage.clear()
                showMessage("Invalid session. Please log in again.", "error")
            }
        }
    }, [navigate])

    const strength = useMemo(() => {
        if(!value) return 0
        const result = passwordStrength(value, strengthOptions)
        return result.id
    }, [value])

    const strengthLabel = useMemo(() => {
        const option = strengthOptions.find(opt => opt.id === strength)
        return option ? option.value : "weak"
    }, [strength])

  return (
    <form onSubmit={handleSubmit(onSubmit)}
    style={{
        height: "100vh",
        width: "100vw"
    }}>
        <Stack
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        h="100vh"
        gap="6">
            <Heading>
                {isUser ? "Sign Up": "Login"}
            </Heading>
       
            {
                statusMessage && (
                    <Box
                    mt="4"
                    p="3"
                    position="fixed"
                    left="50%"
                    top="50%"
                    transform="translate(-50%, -50%)"
                    zIndex={2000}
                    animation={"scale-fade-in"}
                    borderRadius="md"
                    w="78"
                    bg={statusMessage.type === "error" ? "red.50" : "green.50"}
                    borderWidth="1px"
                    borderColor={statusMessage.type === "error" ? "red.200" : "green.200"}
                    >
                        <Text 
                        color={statusMessage.type === "error" ? "red.600" : "green.600"}
                        fontSize="sm"
                        textAlign="center">
                            {statusMessage.text}
                        </Text>
                    </Box>
                )
            }

            <SimpleGrid
            w="100%"
            gap="6"
            paddingX="8">
                {isUser && (
                    <Field.Root>
                        <Input 
                        {...register("username", {
                        required: "Username is required"
                        })}
                        variant="outline"
                        focusRingColor="purple.600"
                        borderColor="purple.200"
                        placeholder="Username"
                        borderRadius="full"/>
                        <Field.ErrorText>
                            {errors.username?.message}
                        </Field.ErrorText>
                    </Field.Root>
                )}
                <Field.Root
                invalid={!!errors.email}>
                    <Input 
                    {...register("email", {
                        required: "Email is required",
                        pattern: {
                            value: /^[A-Za-z\._\-0-9]*[@][A-Za-z]*[\.][a-z]{2,4}$/,
                            message: "Invalid email address"
                        }
                    })}
                    variant="outline"
                    placeholder="Email"
                    focusRingColor="purple.600"
                    borderColor="purple.200"
                    borderRadius="full"/>
                    <Field.ErrorText>
                        {errors.email?.message}
                    </Field.ErrorText>
                </Field.Root>

                <Field.Root>
                    <PasswordInput
                    {...register("password", {
                        required: "Password is required"
                    })}
                    variant="outline"
                    placeholder="Password"
                    borderRadius="full"
                    focusRingColor="purple.600"
                    borderColor="purple.200"
                    value={value}
                    autoFocus/>
                    {value && (
                        <Stack
                        w="full">
                            <PasswordStrengthMeter 
                            value={strength}
                            mt="2"/>
                            <Text
                            fontSize="xs"
                            textAlign="right"
                            fontWeight="bold">
                                {strengthLabel}
                            </Text>
                        </Stack>
                    )}
                    <Field.ErrorText>
                        {errors.password?.message}
                    </Field.ErrorText>
                </Field.Root>
                <Button
                type="submit"
                rounded="full"
                bg={isValid ? "purple.600" : "purple.300"}>
                    {isUser ? "Sign Up": "Login"}
                </Button>
            </SimpleGrid>
            
            <Flex
            alignItems="center"
            gap="4"
            paddingY="4">
                <Text
                fontSize="sm">
                    {isUser ? "Already have an account?": "New User?"}
                </Text>
                <Button
                onClick={toggleMode}
                rounded="full"
                bg={"purple.600"}
                >
                    {isUser ? "Login here" : "Create an account"}
                </Button>
            </Flex>
        </Stack>
    </form>
  )
}

export default Signup