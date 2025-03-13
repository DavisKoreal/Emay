// ExploreScreen.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

// Define navigation param list (adjust based on your app structure)
type RootStackParamList = {
  Explore: undefined;
  Detail: { itemId: number };
};

type Props = NativeStackScreenProps<RootStackParamList, "Explore">;

// Sample data type
interface ExploreItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

// Sample data
const exploreData: ExploreItem[] = [
  {
    id: 1,
    title: "Adventure",
    description: "Explore the mountains",
    imageUrl: "https://via.placeholder.com/150",
  },
  {
    id: 2,
    title: "City Life",
    description: "Urban exploration",
    imageUrl: "https://via.placeholder.com/150",
  },
  {
    id: 3,
    title: "Nature",
    description: "Forest getaway",
    imageUrl: "https://via.placeholder.com/150",
  },
];

const ExploreScreen: React.FC<Props> = ({ navigation }) => {
  // Render each item in the FlatList
  const renderItem = ({ item }: { item: ExploreItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Detail", { itemId: item.id })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Explore</Text>
      <FlatList
        data={exploreData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    padding: 20,
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});

export default ExploreScreen;
