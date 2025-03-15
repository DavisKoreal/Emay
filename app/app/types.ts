export type RootStackParamList = {
    Home: {
      newPhone?: {
        id: string;
        model: string;
        imei: string;
        status: "in_stock" | "sold" | "with_retailer";
        dateUpdated: string;
      };
    };
    // Add other routes here if your app has additional screens
  };
  export default RootStackParamList;