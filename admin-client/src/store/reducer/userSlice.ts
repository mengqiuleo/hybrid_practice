import { createSlice } from "@reduxjs/toolkit"

import { getToken } from "@/utils/auth"


const userSlice = createSlice({
  name: 'user',
  initialState: () => {
    const token = getToken() || null // 从 localStorage中取出token
    return {
      token,
      userInfo: { username: 'alan' }
    }
  },
  reducers: {
    setUserInfo(state, action) {
      const { payload } = action
      state.userInfo = payload
    }
  }
})

export const { setUserInfo } = userSlice.actions

export default userSlice