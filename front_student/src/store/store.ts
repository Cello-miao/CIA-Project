import { configureStore } from "@reduxjs/toolkit";
import rootReducers from "./reducers/root.reducer";

const store = configureStore({
  reducer: rootReducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略这些 action 类型，因为它们包含不可序列化的值
        ignoredActions: ["account/LOGIN_SUCCESS", "account/REGISTER_SUCCESS"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;