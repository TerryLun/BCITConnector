import api from "../utils/api";
import { setAlert } from "./alert";
import {
   REGISTER_SUCCESS,
   REGISTER_FAIL,
   USER_LOADED,
   AUTH_ERROR,
} from "./types";
import setAuthToken from "../utils/setAuthToken";
import axios from "axios";

// Load user
export const loadUser = () => async (dispatch) => {
   if (localStorage.token) {
      setAuthToken(localStorage.token);
   }

   try {
      const res = await axios.get("/api/auth");

      dispatch({
         type: USER_LOADED,
         payload: res.data,
      });
   } catch (error) {
      dispatch({
         type: AUTH_ERROR,
      });
   }
};

// Register User
export const register = (formData) => async (dispatch) => {
   try {
      const res = await api.post("/users", formData);

      dispatch({
         type: REGISTER_SUCCESS,
         payload: res.data,
      });
   } catch (err) {
      const errors = err.response.data.errors;

      if (errors) {
         errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
      }
      dispatch({
         type: REGISTER_FAIL,
      });
   }
};
