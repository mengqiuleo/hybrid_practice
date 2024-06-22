import { configureStore } from "@reduxjs/toolkit"
import userSlice from "./reducer/userSlice"

const store = configureStore({
  reducer: {
    user: userSlice.reducer
  }
})

// 从 store 本身推断出 `RootState` 和 `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;

export default store