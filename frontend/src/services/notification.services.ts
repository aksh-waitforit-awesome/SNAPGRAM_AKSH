import API from "@/api/api"
export const getNotification = async () => {
    const { data } = await API.get("/notification")
    return data
}

