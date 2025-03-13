// import React, { useState } from "react";
// import { 
//   StyleSheet, 
//   Text, 
//   View, 
//   TextInput, 
//   TouchableOpacity, 
//   ActivityIndicator, 
//   ScrollView,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   Dimensions
// } from "react-native";
// import { Picker } from "@react-native-picker/picker";
// import LinearGradient from "react-native-linear-gradient";
// import { MaterialCommunityIcons } from "@expo/vector-icons";
// import { 
//   getFirestore, 
//   doc, 
//   setDoc, 
//   getDoc, 
//   collection, 
//   query, 
//   where, 
//   getDocs 
// } from "firebase/firestore";
// import { app } from "../config/firebase";
// import { useRouter } from "expo-router";

// const db = getFirestore(app);
// const { width } = Dimensions.get('window');

// const counties = [
//   "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", 
//   "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", 
//   "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", 
//   "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", 
//   "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", 
//   "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River", "Tharaka Nithi", 
//   "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
// ];

// const SignUp = () => {
//   const [shopName, setShopName] = useState("");
//   const [contact, setContact] = useState("");
//   const [county, setCounty] = useState("Nairobi");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const validateEmail = (email: string) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   const validateInputs = () => {
//     if (!shopName.trim()) {
//       Alert.alert("Error", "Please enter a shop name");
//       return false;
//     }
//     if (!contact.trim()) {
//       Alert.alert("Error", "Please enter contact information");
//       return false;
//     }
//     if (!email.trim() || !validateEmail(email)) {
//       Alert.alert("Error", "Please enter a valid email address");
//       return false;
//     }
//     if (!/^[0-9]{4}$/.test(password)) {
//       Alert.alert("Error", "Password must be exactly 4 digits");
//       return false;
//     }
//     return true;
//   };

//   const checkEmailExists = async (email: string) => {
//     const shopsRef = collection(db, "shops");
//     const q = query(shopsRef, where("emailAddress", "==", email.toLowerCase()));
//     const querySnapshot = await getDocs(q);
//     return !querySnapshot.empty;
//   };

//   const handleSignUp = async () => {
//     if (!validateInputs()) return;

//     setLoading(true);
//     // Here we use the contact as the shop ID.
//     const shopId = contact;

//     try {
//       // Check if a shop with this ID already exists.
//       const shopRef = doc(db, "shops", shopId);
//       const shopSnapshot = await getDoc(shopRef);
      
//       if (shopSnapshot.exists()) {
//         Alert.alert("Error", "A shop with this contact already exists");
//         setLoading(false);
//         return;
//       }

//       // Check if the email is already registered.
//       const emailExists = await checkEmailExists(email);
//       if (emailExists) {
//         Alert.alert("Error", "This email is already registered");
//         setLoading(false);
//         return;
//       }

//       // Create the shop document.
//       await setDoc(shopRef, {
//         name: shopName,
//         contact,
//         county,
//         emailAddress: email.toLowerCase(),
//         password,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString()
//       });

//       // Create placeholder documents in subcollections for inventory, sales, and users.
//       await setDoc(doc(db, "shops", shopId, "inventory", "placeholder"), {});
//       await setDoc(doc(db, "shops", shopId, "sales", "placeholder"), {});
//       await setDoc(doc(db, "shops", shopId, "users", "placeholder"), {});

//       Alert.alert(
//         "Success",
//         "Your shop has been registered successfully!",
//         [
//           {
//             text: "OK",
//             onPress: () => router.replace("/login")
//           }
//         ]
//       );
//     } catch (error) {
//       console.error("Error during signup:", error);
//       Alert.alert(
//         "Error",
//         "An error occurred during registration. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <LinearGradient colors={["#1a2a6c", "#b21f1f"]} style={styles.container}>
//       <KeyboardAvoidingView 
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.keyboardView}
//       >
//         <ScrollView 
//           style={styles.scrollView}
//           showsVerticalScrollIndicator={false}
//           bounces={false}
//         >
//           <View style={styles.header}>
//             <TouchableOpacity 
//               onPress={() => router.replace("/login")} 
//               style={styles.backButton}
//               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//             >
//               <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.formContainer}>
//             <MaterialCommunityIcons 
//               name="store-plus" 
//               size={50} 
//               color="#fff" 
//               style={styles.icon}
//             />
//             <Text style={styles.welcomeText}>Create Account</Text>
//             <Text style={styles.subtitleText}>Register your shop details below</Text>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Shop Name</Text>
//               <View style={styles.inputWrapper}>
//                 <MaterialCommunityIcons 
//                   name="store" 
//                   size={20} 
//                   color="rgba(255,255,255,0.5)" 
//                   style={styles.inputIcon}
//                 />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter shop name"
//                   placeholderTextColor="rgba(255,255,255,0.5)"
//                   value={shopName}
//                   onChangeText={setShopName}
//                   editable={!loading}
//                 />
//               </View>
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Contact Info</Text>
//               <View style={styles.inputWrapper}>
//                 <MaterialCommunityIcons 
//                   name="phone" 
//                   size={20} 
//                   color="rgba(255,255,255,0.5)" 
//                   style={styles.inputIcon}
//                 />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter contact number"
//                   placeholderTextColor="rgba(255,255,255,0.5)"
//                   value={contact}
//                   onChangeText={setContact}
//                   keyboardType="phone-pad"
//                   editable={!loading}
//                 />
//               </View>
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>County</Text>
//               <View style={styles.pickerWrapper}>
//                 <MaterialCommunityIcons 
//                   name="map-marker" 
//                   size={20} 
//                   color="rgba(255,255,255,0.5)" 
//                   style={styles.inputIcon}
//                 />
//                 <Picker
//                   selectedValue={county}
//                   onValueChange={(itemValue) => setCounty(itemValue)}
//                   style={styles.picker}
//                   enabled={!loading}
//                 >
//                   {counties.map((c) => (
//                     <Picker.Item 
//                       key={c} 
//                       label={c} 
//                       value={c} 
//                       color={Platform.OS === 'ios' ? '#fff' : '#000'}
//                     />
//                   ))}
//                 </Picker>
//               </View>
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Email Address</Text>
//               <View style={styles.inputWrapper}>
//                 <MaterialCommunityIcons 
//                   name="email" 
//                   size={20} 
//                   color="rgba(255,255,255,0.5)" 
//                   style={styles.inputIcon}
//                 />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter email address"
//                   placeholderTextColor="rgba(255,255,255,0.5)"
//                   value={email}
//                   onChangeText={setEmail}
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                   editable={!loading}
//                 />
//               </View>
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>4-digit Password</Text>
//               <View style={styles.inputWrapper}>
//                 <MaterialCommunityIcons 
//                   name="lock" 
//                   size={20} 
//                   color="rgba(255,255,255,0.5)" 
//                   style={styles.inputIcon}
//                 />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter 4-digit password"
//                   placeholderTextColor="rgba(255,255,255,0.5)"
//                   value={password}
//                   onChangeText={setPassword}
//                   keyboardType="numeric"
//                   maxLength={4}
//                   secureTextEntry
//                   editable={!loading}
//                 />
//               </View>
//             </View>

//             <TouchableOpacity 
//               style={[styles.registerButton, loading && styles.disabledButton]} 
//               onPress={handleSignUp}
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator color="#fff" />
//               ) : (
//                 <>
//                   <MaterialCommunityIcons 
//                     name="account-plus" 
//                     size={24} 
//                     color="#fff" 
//                     style={styles.buttonIcon}
//                   />
//                   <Text style={styles.registerText}>Create Account</Text>
//                 </>
//               )}
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={styles.loginLink}
//               onPress={() => router.replace("/login")}
//               disabled={loading}
//             >
//               <Text style={styles.loginLinkText}>
//                 Already have an account? Sign In
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </LinearGradient>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   keyboardView: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   header: {
//     height: 60,
//     justifyContent: "center",
//     paddingHorizontal: 20,
//     marginTop: 20,
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "rgba(255,255,255,0.1)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 30,
//   },
//   formContainer: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },
//   icon: {
//     alignSelf: "center",
//     marginVertical: 20,
//   },
//   welcomeText: {
//     fontSize: 32,
//     fontWeight: "bold",
//     color: "#fff",
//     textAlign: "center",
//     marginBottom: 8,
//   },
//   subtitleText: {
//     fontSize: 16,
//     color: "rgba(255,255,255,0.7)",
//     textAlign: "center",
//     marginBottom: 30,
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   label: {
//     color: "#fff",
//     fontSize: 16,
//     marginBottom: 8,
//     fontWeight: "500",
//   },
//   inputWrapper: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   inputIcon: {
//     marginLeft: 15,
//   },
//   input: {
//     flex: 1,
//     color: "#fff",
//     fontSize: 16,
//     padding: 15,
//     paddingLeft: 10,
//   },
//   pickerWrapper: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//     overflow: "hidden",
//   },
//   picker: {
//     flex: 1,
//     color: "#fff",
//     height: 50,
//   },
//   registerButton: {
//     flexDirection: "row",
//     backgroundColor: "rgba(255,255,255,0.15)",
//     padding: 16,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 20,
//   },
//   disabledButton: {
//     opacity: 0.7,
//   },
//   buttonIcon: {
//     marginRight: 10,
//   },
//   registerText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "600",
//   },
//   loginLink: {
//     marginTop: 20,
//     alignItems: "center",
//   },
//   loginLinkText: {
//     color: "rgba(255,255,255,0.7)",
//     fontSize: 16,
//     textDecorationLine: "underline",
//     marginBottom: 60,
//   },
// });

// export default SignUp;
