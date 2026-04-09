import { notificationsService } from "@/services/notificationsService"
import { useMutation } from "@tanstack/react-query"

export const useSaveFcmToken= () => {
  return useMutation({
    mutationFn: notificationsService.saveFcmToken
  })
}