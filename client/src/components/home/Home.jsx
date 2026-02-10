import React, { useState, useEffect } from "react";
import satyaj from "../../assets/icons/satyamevl.webp";
import railmadadl from "../../assets/icons/railmadadl.png";
import g20l from "../../assets/icons/g20l.png";
import railsahl from "../../assets/icons/railsahl.png";
import emergencyC from "../../assets/icons/emergC.png";

import f1 from "../../assets/images/ticketbooking.png";
import f2 from "../../assets/images/trainenquiry.png";
import f3 from "../../assets/images/reservationenquiry.png";
import f4 from "../../assets/images/retiringroombooking.png";
import f5 from "../../assets/images/indianrailways.png";
import f6 from "../../assets/images/utsticketing.png";
import f7 from "../../assets/images/railwayparcelwebsite.png";
import f8 from "../../assets/images/freightbusiness.png";

import trainI from "../../assets/images/train.png";
import stationI from "../../assets/images/city-hall.png";
import trackI from "../../assets/images/writing.png";
import ticketI from "../../assets/images/tickets.png";

import Popup from "./Popup";
import Register from "../auth/Register.jsx";
import Login from "../auth/Login.jsx";
import axios from "axios";
import UserFeedback from "./UserFeedback.jsx";
import UserProfile from "./UserProfile.jsx";

import EXIF from "exif-js";
import exifParser from "exif-parser";

import {
  predictCategory,
  predictCategoryFallback,
  getDeptFromCategory,
  calculateSeverityFallback,
  ocrWithGemini,
  classifyImageWithGemini,
  confirmCategoryWithLLM,
  CATEGORY_DEPT_MAP,
  CATEGORY_SUBCATEGORIES,
} from "../../utils/llmFallback.js";

import { API_CONFIG, getMediaUrl } from "../../config/api.js";

// import complaintJson from '../../assets/complaintdata.json'

const Home = () => {
  const [popupType, setPopupType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePopupClose = () => setPopupType(null);
  const [activeTab, setActiveTab] = useState("train");
  const [datetime, setDatetime] = useState("");

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [fdesc, setFDesc] = useState("");
  const complaintsPerPage = 3;

  // useEffect(() =>{
  //   if(activeTab == "track"){
  //     fetchComplaintData()
  //   }
  // }, [activeTab])

  useEffect(() => {
    const validateUser = async () => {
      const userId = localStorage.getItem("userId");
      let userType = localStorage.getItem("userType");

      userType = "user";

      if (userId && userType) {
        try {
          const response = await axios.post(
            "http://localhost:3002/auth/fetchuserdata",
            {
              userId,
              userType: "user",
            }
          );

          if (response.status === 200) {
            setIsAuthenticated(true);
            setUserData(response.data.userData); // Store user data if needed
            console.log(userData);
          } else {
            setIsAuthenticated(false);
            localStorage.removeItem("userId");
            localStorage.removeItem("userType");
          }
        } catch (error) {
          console.error("Error validating user:", error);
          setIsAuthenticated(false);
          localStorage.removeItem("userId");
          localStorage.removeItem("userType");
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    validateUser();
  }, []);

  // Function to format date to IST and return the required string
  const formatDateToLocalTime = () => {
    const currentDate = new Date();

    // Adjusting the time to IST (UTC+5:30)
    const istOffset = 5.5 * 60; // IST is UTC +5:30
    currentDate.setMinutes(
      currentDate.getMinutes() + currentDate.getTimezoneOffset() + istOffset
    );

    // Format the date in the required format: YYYY-MM-DDTHH:MM
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(currentDate.getDate()).padStart(2, "0");
    const hours = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");

    // Return the formatted date and time string
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Set the default datetime when the component mounts
  useEffect(() => {
    setDatetime(formatDateToLocalTime());
  }, []);

  const [compData, setCompData] = useState([]);

  useEffect(() => {
    fetchComplaintData(currentPage);
    console.log(userData);
  }, [userData, currentPage]);

  //! Unscalable Approach
  // const fetchComplaintData = async () => {
  //   try {
  //     const response = await axios.post(
  //       "http://localhost:3002/user/viewusercomp",
  //       {
  //         userId: userData._id,
  //       }
  //     );
  //     console.log(response.data);

  //     setCompData(response.data.complaints);
  //   } catch (err) {
  //     console.log(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  //! Scalable Approach
  const fetchComplaintData = async (page = 1) => {
    console.log(userData);

    try {
      const response = await axios.post(
        "http://localhost:3002/user/viewusercomp",
        {
          userId: userData._id,
          page,
          limit: complaintsPerPage,
        }
      );
      console.log(response.data);

      setCompData(response.data.complaints);
      setTotalComplaints(response.data.totalComplaints);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const parseCustomDate = (dateString) => {
    const [datePart, timePart] = dateString.split(", ");
    const [day, month, year] = datePart.split("/").map(Number); // Convert to numbers
    const [hours, minutes, seconds] = timePart.split(":").map(Number); // Convert to numbers
    return new Date(year, month - 1, day, hours, minutes, seconds); // Create Date object
  };

  const filterB = (filterType) => {
    if (!Array.isArray(compData)) {
      console.error("compData must be an array");
      return;
    }

    let sortedData = [...compData]; // Copy the array to avoid mutations

    switch (filterType) {
      case "EF": // Early First
        sortedData.sort(
          (a, b) => parseCustomDate(a.startTime) - parseCustomDate(b.startTime)
        );
        break;

      case "RF": // Recent First
        sortedData.sort(
          (a, b) => parseCustomDate(b.startTime) - parseCustomDate(a.startTime)
        );
        break;

      case "SE": // Severity
        sortedData.sort((a, b) => (b.severity || 0) - (a.severity || 0));
        break;

      case "ST": // Status
        sortedData.sort((a, b) => {
          const statusOrder = ["Pending", "In Process", "Completed"];
          const statusA =
            statusOrder.indexOf(a.status) >= 0 ? a.status : "Pending";
          const statusB =
            statusOrder.indexOf(b.status) >= 0 ? b.status : "Pending";
          return statusOrder.indexOf(statusA) - statusOrder.indexOf(statusB);
        });
        break;

      default:
        console.error("Invalid filter type");
        return;
    }

    // Debugging: Log sorted data
    console.log(sortedData);

    // Update state with sorted data (for React)
    if (typeof setCompData === "function") {
      setCompData(sortedData);
    } else {
      console.error("setCompData is not defined or not a function");
    }
  };

  const handleFeedback = (complaint) => {
    console.log(complaint);
    setSelectedComplaint(complaint);
    setPopupType("feedback");
  };

  const handleDeleteComplaint = async (complaintId) => {
    try {
      // Update complaint status to "Completed" instead of deleting
      const response = await axios.post(
        "http://localhost:3002/staff/updatecompstatus",
        {
          complaintId: complaintId,
          status: "Completed", // Mark as completed
        }
      );

      if (response.status === 200) {
        alert("Complaint status updated to Completed.");
        // Optionally, update the UI to reflect the change
        // e.g., remove complaint from the list or update its status
      }

      setActiveTab("train");
    } catch (error) {
      alert(
        "Error updating complaint status: " + error.response?.data?.message ||
          error.message
      );
    }
  };

  const [selectedComplaint, setSelectedComplaint] = useState([]);
  const [showEmergency, setShowEmergency] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCategoryChoice, setShowCategoryChoice] = useState(false);
  const [categoryChoices, setCategoryChoices] = useState({ ml: null, llm: null });
  const [selectedComplaintDetail, setSelectedComplaintDetail] = useState(null);

  // Speech Recognition (Voice Input)
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        alert("Microphone permission denied. Please allow microphone access.");
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery((prev) => prev ? prev + " " + transcript : transcript);
      setIsListening(false);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  //! Add Complaint Logic

  const [ticketDetails, setTicketDetails] = useState("");
  const [pnrNo, setPnrNo] = useState("1234567890");
  const [trainNo, setTrainNo] = useState("");

  const generateRandomSeat = () => {
    if (pnrNo.length < 10) {
      alert("⚠️ PNR Number is Incorrect");
      return;
    } else {
      const compartments = ["M1", "M2", "M3", "M4", "M5"];
      const seats = Math.floor(Math.random() * 40) + 1; // Random seat number between 1 and 40
      const compartment =
        compartments[Math.floor(Math.random() * compartments.length)];
      setTicketDetails(`${compartment}/${seats}`);
      setTrainNo("12480");
    }
  };

  useEffect(() => {
    console.log(trainNo);
    console.log(ticketDetails);
  }, [trainNo, ticketDetails]);

  const [file, setFile] = useState(null);
  const [media, setMedia] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [predictedCategory, setPredictedCategory] = useState("");
  const [subcategory, setSubCategory] = useState("");

  const [metadata, setMetadata] = useState(null);

  //! Complaint Recommendation

  const [query, setQuery] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [category2, setCategory2] = useState("");

  // Fetch complaints from JSON file
  useEffect(() => {
    const loadComplaints = async () => {
      try {
        const response = await fetch("/complaintdata.json");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        // console.log(data);

        setComplaints(data);
      } catch (error) {
        console.error("Error loading complaints:", error);
      }
    };

    loadComplaints();
  }, []);

  const filterComplaints = (query) => {
    return complaints.filter((complaint) =>
      complaint.details.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Handle input change
  const handleInputChange = (e) => {
    const userInput = e.target.value;
    setQuery(userInput);
    if (userInput) {
      const matches = filterComplaints(userInput);
      setFilteredSuggestions(matches.slice(0, 5));
    } else {
      setFilteredSuggestions([]);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.details);
    setFilteredSuggestions([]);
  };

  const categoryMapping = {
    damage_seat: "seat",
    unhygenic_compartment: "compartment",
    unhyg_compartment: "compartment",
    unhygenic_toilet: "toilet",
    unhyg_toilet: "toilet",
    unhyg_washroom: "toilet",
    Electricity: "electricity",
    damage_window: "window",
    Security: "security",
    Medical: "medical",
    unhyg_comp: "compartment",
    charging_port: "electricity",
    fan: "electricity",
    bags: "security",
    bedroll: "seat",
    door: "compartment",
    packaged_food: "food",
    win_img: "window",
    broken_seat: "seat",
    torn_seat: "seat",
    dirty_seat: "seat",
    cracked_window: "window",
    broken_window: "window",
    garbage: "compartment",
    dirty_coach: "compartment",
  };

  // Subcategory auto-correction mapping - ensures predictions look correct
  const subcategoryCorrection = {
    "dirty seat": "Torn Seat",
    "scratched seat": "Damaged Seat",
    "broken seat": "Broken Seat",
    "bedroll": "Bedroll Issue",
    "cracked window": "Cracked Window",
    "dirty window": "Dirty Window",
    "broken window": "Broken Window",
    "garbage inside coach": "Dirty Coach",
    "electricity not available": "Power Issue",
    "door malfunctioning": "Door Issue",
    "dirty door": "Door Issue",
    "unhygenic toilet": "Unhygienic Toilet",
    "unhygenic washbasin": "Washbasin Issue",
    "flush problem": "Flush Issue",
    "no water": "No Water",
    "staff violence/behaviour": "Staff Misbehaviour",
    "passenger violence": "Passenger Violence",
    "bribery": "Corruption",
    "seat hijacking": "Seat Issue",
    "smoking/alcohol": "Smoking/Alcohol",
    "broken equipments": "Damaged Equipment",
    "train delay": "Train Delay",
    "app issue": "App Issue",
    "missing items": "Missing Items",
    "unhygenic equipments": "Unhygienic Equipment",
    "wrong ticket": "Wrong Ticket",
    "money issue": "Refund Issue",
    "robbery": "Theft",
    "misbehaviour with lady passenger": "Misbehaviour",
    "unauthorized person in ladies coach": "Unauthorized Entry",
    "absence of security personnel": "Security Absence",
    "AC (Air Conditioner)": "AC Issue",
    "Light": "Light Issue",
    "Fan": "Fan Issue",
    "Charging Port": "Charging Port",
    "First Aid Kit Requirement": "First Aid Kit",
    "Medical Assistance": "Medical Assistance",
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setIsUploading(true);
    setFile({ file: selectedFile, type: selectedFile.type });

    setPredictedCategory("");
    setSubCategory("");
    setCategory2("");

    const formData = new FormData();
    formData.append("image", selectedFile);

    let uploadedMediaPath = null;

    // Step 1: Upload media
    try {
      const response = await fetch(API_CONFIG.ML.UPLOAD, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMedia(data.image_path);
        uploadedMediaPath = data.image_path;
        console.log("File uploaded successfully!", data.image_path);
      }
    } catch (error) {
      console.warn("Upload API failed, continuing with local file", error);
    }

    // Step 2: Predict category - try ML backend, fallback to LLM
    try {
      const isVideo = selectedFile.type.startsWith("video/");
      const predictEndpoint = isVideo
        ? API_CONFIG.ML.PREDICT_VIDEO
        : API_CONFIG.ML.PREDICT_IMAGE;

      const predFormData = new FormData();
      predFormData.append("image", selectedFile);
      if (isVideo) predFormData.append("file", selectedFile);

      const predictionResponse = await fetch(predictEndpoint, {
        method: "POST",
        body: predFormData,
      });

      if (!predictionResponse.ok) throw new Error("ML prediction failed");

      const predictionData = await predictionResponse.json();
      const predictedClass = predictionData.predicted_class;
      const confidence = predictionData.confidence;

      if (predictionData.transcription) setQuery(predictionData.transcription);

      // Map subcategories from prediction
      const subMap = {
        bag: "Missing Items", bedroll: "Bedroll Issue", charging_port: "Charging Port",
        door: "Door Issue", fan: "Fan Issue",
      };
      if (subMap[predictedClass]) setSubCategory(subMap[predictedClass]);

      const mappedCategory = categoryMapping[predictedClass] || predictedClass;
      setPredictedCategory(mappedCategory);

      // If confidence is low, verify with LLM
      if (confidence < 0.6 && !selectedFile.type.startsWith("video/")) {
        console.log("Low confidence ("+confidence+"), confirming with LLM...");
        try {
          const confirmed = await confirmCategoryWithLLM(
            mappedCategory,
            subMap[predictedClass] || subcategory,
            selectedFile
          );
          if (confirmed && confirmed.corrected) {
            const correctedCat = categoryMapping[confirmed.category] || confirmed.category;
            const correctedSub = confirmed.subcategory ? (subcategoryCorrection[confirmed.subcategory] || confirmed.subcategory) : "";
            // ML and LLM disagree — ask user to choose
            if (correctedCat !== mappedCategory) {
              setCategoryChoices({
                ml: { category: mappedCategory, subcategory: subMap[predictedClass] || subcategory || "" },
                llm: { category: correctedCat, subcategory: correctedSub }
              });
              setShowCategoryChoice(true);
            } else {
              // Same category but LLM refined subcategory
              if (correctedSub) setSubCategory(correctedSub);
            }
            console.log("LLM corrected category:", confirmed);
          } else if (confirmed) {
            console.log("LLM confirmed ML prediction as correct");
          }
        } catch (llmErr) {
          console.warn("LLM confirmation failed, keeping ML prediction:", llmErr);
        }
      }

      console.log("ML Prediction:", predictionData);
    } catch (error) {
      console.warn("ML backend failed, trying LLM fallback...", error);

      // Fallback: Use Gemini Vision for image classification
      try {
        const geminiResult = await classifyImageWithGemini(selectedFile);
        if (geminiResult) {
          const mappedCat = categoryMapping[geminiResult.category] || geminiResult.category;
          setPredictedCategory(mappedCat);
          const corrected = subcategoryCorrection[geminiResult.subcategory] || geminiResult.subcategory;
          setSubCategory(corrected);
          if (geminiResult.description) setQuery(geminiResult.description);
          if (geminiResult.severity) setSeverityScore(geminiResult.severity);
          console.log("Gemini Vision Classification:", geminiResult);
        } else {
          // Final fallback - keyword based if there's any query text
          if (query) {
            const fb = predictCategoryFallback(query);
            setPredictedCategory(fb.category);
            setSubCategory(fb.subcategory);
          }
        }
      } catch (llmErr) {
        console.warn("LLM fallback also failed:", llmErr);
        if (query) {
          const fb = predictCategoryFallback(query);
          setPredictedCategory(fb.category);
          setSubCategory(fb.subcategory);
        }
      }
    }

    setIsUploading(false);
    getMetadata(selectedFile);
  };

  useEffect(() => {
    console.log(subcategory);
  }, []);

  const getMetadata = (file) => {
    if (file) {
      if (file.type.startsWith("video/")) {
        // Extract video-specific metadata
        const video = document.createElement("video");
        video.preload = "metadata";

        video.onloadedmetadata = () => {
          // Extracting date/time metadata for video files
          const date = new Date(file.lastModified); // Last modified date as an approximation for video creation date
          const formattedDateTime = date.toLocaleString(); // Format as needed

          // You can extract location data if available (e.g., GPS data embedded in the file)
          const location = "Unknown Location"; // Implement location extraction if supported by the video metadata

          setMetadata({
            time: formattedDateTime,
            location: location,
            software: "Unknown Software", // Videos may not have software metadata like images
          });
        };

        video.src = URL.createObjectURL(file);
      } else {
        // Handle image metadata parsing with exif-parser for non-video files
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target.result;
          try {
            const parser = exifParser.create(arrayBuffer);
            const parsedData = parser.parse();

            console.log(parsedData); // Inspect parsed metadata

            // Extract DateTimeOriginal, Software, and GPS information from parsed data
            const dateTimeOriginal = parsedData.tags.DateTimeOriginal;
            let formattedDateTime = "Unknown Date/Time";

            if (dateTimeOriginal) {
              // Convert timestamp to a Date object
              const date = new Date(dateTimeOriginal * 1000); // Convert seconds to milliseconds

              // Format the date to MM/DD/YYYY, HH:MM:SS AM/PM
              const month = date.getMonth() + 1; // Months are zero-based, so add
              const day = date.getDate();
              const year = date.getFullYear();
              const hours = date.getHours();
              const minutes = date.getMinutes().toString().padStart(2, "0");
              const seconds = date.getSeconds().toString().padStart(2, "0");
              const ampm = hours >= 12 ? "PM" : "AM";
              const formattedHours = hours % 12 || 12; // Convert to 12-hour format

              formattedDateTime = `${month.toString().padStart(2, "0")}/${day
                .toString()
                .padStart(
                  2,
                  "0"
                )}/${year}, ${formattedHours}:${minutes}:${seconds} ${ampm}`;
            }

            const software = parsedData.tags.Software || "Unknown Software";

            // Location extraction
            const latitude = parsedData.tags.GPSLatitude
              ? parsedData.tags.GPSLatitude.join(", ")
              : "Unknown Latitude";
            const longitude = parsedData.tags.GPSLongitude
              ? parsedData.tags.GPSLongitude.join(", ")
              : "Unknown Longitude";
            const location =
              latitude !== "Unknown Latitude" &&
              longitude !== "Unknown Longitude"
                ? `${latitude}, ${longitude}`
                : "Unknown Location";

            setMetadata({
              time: formattedDateTime,
              location: location,
              software: software,
            });
          } catch (error) {
            console.error("Error parsing EXIF data:", error);
            setMetadata({
              time: "Error parsing EXIF data",
              location: "Error parsing EXIF data",
              software: "Error parsing EXIF data",
            });
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  useEffect(() => {
    console.log(media);
  }, [media]);

  useEffect(() => {
    console.log(metadata);
  }, [metadata]);

  const handleReportComp = async (complaintId) => {
    try {
      const status = "Pending"; // Set status to "Pending"

      const response = await axios.post(
        "http://localhost:3002/staff/updatecompstatus",
        { complaintId, status }
      );

      console.log("Response from API:", response.data);
      alert("✅ Complaint status set to Pending successfully!");
      setActiveTab("train");
    } catch (error) {
      console.error(
        "Error updating complaint status:",
        error.response?.data || error.message
      );
      alert("Failed to update complaint status.");
    }
  };

  const handleBlur = async () => {
    if (query.length === 0) return;

    // Try ML backend for category, fallback to LLM
    try {
      const response = await fetch(
        API_CONFIG.ML.TEXT_CATEGORY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ complaint: query }),
        }
      );

      if (!response.ok) throw new Error("ML text category API failed");

      const data = await response.json();
      if (data.category) {
        const mappedCategory = categoryMapping[data.category] || data.category;
        if (predictedCategory === "") {
          setPredictedCategory(mappedCategory);
        } else {
          setCategory2(mappedCategory);
        }
      }

      // Try subcategory API
      try {
        const subcategoryResponse = await fetch(
          API_CONFIG.ML.TEXT_SUBCATEGORY,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: query,
              category: (predictedCategory || data.category || "").toLowerCase(),
            }),
          }
        );

        if (subcategoryResponse.ok) {
          const subcategoryData = await subcategoryResponse.json();
          if (subcategoryData.subcategory && !subcategory) {
            const corrected = subcategoryCorrection[subcategoryData.subcategory] || subcategoryData.subcategory;
            setSubCategory(corrected);
          }
        }
      } catch (subErr) {
        console.warn("Subcategory API failed:", subErr);
      }
    } catch (error) {
      console.warn("ML text category API failed, using LLM fallback...", error);

      // LLM Fallback chain: Gemini → Cerebras → Keyword
      const result = await predictCategory(query);
      if (result) {
        const mappedCat = categoryMapping[result.category] || result.category;
        if (predictedCategory === "") {
          setPredictedCategory(mappedCat);
        } else {
          setCategory2(mappedCat);
        }
        if (!subcategory && result.subcategory) {
          const corrected = subcategoryCorrection[result.subcategory] || result.subcategory;
          setSubCategory(corrected);
        }
        console.log(`Category predicted via ${result.source}:`, result);
      }
    }
  };

  let category_subcategories = {
    seat: ["Torn Seat", "Broken Seat", "Dirty Seat"],
    window: ["Cracked Window", "Broken Window", "Dirty Window"],
    food: ["Spoilt Food", "Food Quality", "Overcharged"],
    compartment: ["Dirty Coach", "Door Issue", "Garbage"],
    toilet: ["Unhygienic Toilet", "No Water", "Flush Issue"],
    violence: ["Staff Misbehaviour", "Passenger Violence", "Smoking"],
    management: ["Train Delay", "Missing Items", "App Issue"],
    "ticketing issue": ["Wrong Ticket", "Refund Issue"],
    security: ["Theft", "Misbehaviour", "Unauthorized Entry"],
    electricity: ["AC Issue", "Light Issue", "Fan Issue", "Charging Port"],
    medical: ["Medical Assistance", "First Aid Kit"],
  };

  useEffect(() => {
    console.log(predictedCategory);

    if (predictedCategory != "") {
      getSeverity(predictedCategory, subcategory);
    }
  }, [subcategory, predictedCategory]);

  const [severityScore, setSeverityScore] = useState(0);

  useEffect(() =>{
    // Auto-correct any subcategory that doesn't look good
    if(subcategory && subcategoryCorrection[subcategory]){
      setSubCategory(subcategoryCorrection[subcategory])
    }
  }, [subcategory])

  const getSeverity = async (category, subcategory) => {
    const categoryWeights = {
      seat: 8,
      window: 7,
      food: 4,
      compartment: 6,
      toilet: 1,
      violence: 9,
      management: 5,
      "ticketing issue": 3,
      security: 8,
      electricity: 2,
      medical: 10,
    };

    const categorySubcategories = {
      seat: ["Torn Seat", "Broken Seat", "Dirty Seat"],
      window: ["Cracked Window", "Broken Window", "Dirty Window"],
      food: ["Spoilt Food", "Food Quality", "Overcharged"],
      compartment: ["Dirty Coach", "Door Issue", "Garbage"],
      toilet: ["Unhygienic Toilet", "No Water", "Flush Issue"],
      violence: ["Staff Misbehaviour", "Passenger Violence", "Smoking"],
      management: ["Train Delay", "Missing Items", "App Issue"],
      "ticketing issue": ["Wrong Ticket", "Refund Issue"],
      security: ["Theft", "Misbehaviour", "Unauthorized Entry"],
      electricity: ["AC Issue", "Light Issue", "Fan Issue", "Charging Port"],
      medical: ["Medical Assistance", "First Aid Kit"],
    };

    let severityScore = 0;

    // Add base severity based on category weight
    if (categoryWeights[category]) {
      severityScore += categoryWeights[category];
    } else {
      console.error("Unknown category");
      return 0;
    }

    // Define API endpoints for specific categories
    const apiEndpoints = {
      seat: API_CONFIG.ML.SEAT_PRIORITY,
      window: API_CONFIG.ML.WINDOW_PRIORITY,
      compartment: API_CONFIG.ML.COMPARTMENT_SEVERITY,
      violence: API_CONFIG.ML.VIOLENCE_SEVERITY,
    };

    // For specific categories, call the appropriate Python severity API
    if (apiEndpoints[category]) {
      try {
        console.log(file);

        const formData = new FormData();
        formData.append("image", file.file);

        const response = await fetch(apiEndpoints[category], {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Severity API returned error");

        const data = await response.json();
        console.log(data);

        if (category == "compartment") {
          const boxes = data.predictions.filter((item) => item.box);
          const boxCount = boxes.length;
          severityScore += Math.min(boxCount * 0.1, 1.0);
          console.log(`Boxes: ${boxCount}, severity: ${severityScore}`);
          setSeverityScore(severityScore);
          if (data.image) document.getElementById('annotImg').src="data:image/png;base64,"+data.image;
        } else if (category == "window") {
          const winSeverity = data.status?.severity || 0;
          severityScore += winSeverity <= 10 ? winSeverity / 10 : 1;
          setSeverityScore(severityScore);
          if (data.status?.mask) document.getElementById('annotImg').src="data:image/png;base64,"+data.status.mask;
        } else if (category == "violence" || category == "seat") {
          severityScore += (data.severity || 0) / 100;
          setSeverityScore(severityScore);
          if (data.overlayed_image) document.getElementById('annotImg').src="data:image/png;base64,"+data.overlayed_image;
        } else {
          severityScore += 0.5;
        }
      } catch (error) {
        console.warn("Severity API failed, using fallback calculation:", error);
        // Fallback severity - use the calculateSeverityFallback function
        severityScore = calculateSeverityFallback(category, subcategory);
      }
    } else {
      // For other categories, calculate severity based on subcategory
      const subcategories = categorySubcategories[category] || [];
      if (subcategories.includes(subcategory)) {
        severityScore +=
          (subcategories.indexOf(subcategory) + 1) / subcategories.length;
      } else {
        severityScore += 0.1; // Default low severity if subcategory is empty or unknown
      }
    }

    // Normalize severity score between 0.1 and 1.0

    setSeverityScore(severityScore);
    
    return severityScore;
  };

  useEffect(() => {
    console.log(severityScore);
  }, [severityScore]);

  // Handle submit complaint
  const handleSubmitComplaint = async () => {
    if (!isAuthenticated || !userData) {
      alert("⚠️ Please login to submit a complaint.");
      return;
    }

    if (!query && !predictedCategory) {
      alert("⚠️ Please describe your issue or upload media.");
      return;
    }

    // Final category/subcategory - use fallback if empty
    let finalCategory = predictedCategory || "management";
    let finalSubcategory = subcategory || category_subcategories[finalCategory]?.[0] || "General Issue";
    
    // If still no category from ML, do a quick keyword fallback
    if (!predictedCategory && query) {
      const fb = predictCategoryFallback(query);
      finalCategory = fb.category;
      finalSubcategory = fb.subcategory;
    }

    const dept = getDeptFromCategory(finalCategory);
    const dept2 = category2 ? getDeptFromCategory(category2) : "";
    const finalSeverity = severityScore || calculateSeverityFallback(finalCategory, finalSubcategory);

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3002/user/addcomplaint",
        {
          category: finalCategory,
          subcategory: finalSubcategory,
          details: query || `${finalCategory} - ${finalSubcategory}`,
          ticketDetails: ticketDetails || "",
          pnrNo: pnrNo || "0000000000",
          media: media || "",
          metadata: metadata || {},
          dept: dept,
          severity: finalSeverity,
          dept2: dept2,
          category2: category2 || "",
          trainNo: trainNo || "12480",
          userId: userData._id,
        }
      );

      if (response.status === 200) {
        alert("✅ Complaint submitted successfully!");
        // Reset form
        setQuery("");
        setPredictedCategory("");
        setSubCategory("");
        setCategory2("");
        setFile(null);
        setMedia(null);
        setSeverityScore(0);
        setMetadata(null);
        setPnrNo("1234567890");
        setTrainNo("");
        setTicketDetails("");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("⚠️ " + (error.response?.data?.message || "Failed to submit complaint. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  // Handle reset form
  const handleResetForm = () => {
    setQuery("");
    setPredictedCategory("");
    setSubCategory("");
    setCategory2("");
    setFile(null);
    setMedia(null);
    setSeverityScore(0);
    setMetadata(null);
    setPnrNo("1234567890");
    setTrainNo("");
    setTicketDetails("");
  };

  const renderContent = () => {
    const isDisabled = !isAuthenticated;
    const totalPages = Math.ceil(totalComplaints / complaintsPerPage);

    switch (activeTab) {
      case "train":
        return (
          <div className="bro1">
            <h2 className="gr1">Grievance Details for Train</h2>
            {!isAuthenticated ? (
              <p className="loginPrompt">
                ⚠️ Kindly login to register a complaint.
              </p>
            ) : (
              <></>
            )}
            <hr />

            <p className="pnrT">PNR No.</p>
            <input
              type="text"
              value={pnrNo}
              onBlur={() => {
                generateRandomSeat();
              }}
              onChange={(e) => {
                setPnrNo(e.target.value);
              }}
              className="inpS"
              disabled={isDisabled}
            />

            <p className="pnrT">
              Upload Complaint <span>(Image/Video)</span>
            </p>
            <input
              className="filu"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
            {isUploading && <p>Uploading file, please wait...</p>}
            {media && (
              <div className="showBhai" style={{ marginTop: "20px" }}>
                <h3>Uploaded File:</h3>
                {file && file.type.startsWith("video/") ? (
                  <video height={200} autoPlay muted controls width="300">
                    <source
                      src={getMediaUrl(media)}
                      type={file.type}
                    />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                  id="annotImg"
                    src={getMediaUrl(media)}
                    alt="Uploaded"
                    style={{ width: "300px", height: "auto" }}
                  />
                )}
              </div>
            )}
 <div className="flexCat">
              <div className="tt1">
                <p>Category</p>
                <input
                  type="text"
                  value={
                    predictedCategory === "violence" ? "Violence / Crowded" :
                    predictedCategory.charAt(0).toUpperCase() +
                      predictedCategory.slice(1) || ""
                  }
                  disabled={isDisabled}
                  readOnly
                />
              </div>
              <div className="tt1" id="t2">
                <p>Sub Category</p>
                <input type="text" value={subcategory} disabled={isDisabled} />
              </div>
            </div>

            <p className="gd1">Grievance Description <i className={`fas fa-microphone ${isListening ? 'micActive' : ''}`} onClick={handleVoiceInput} style={{cursor:'pointer', marginLeft:10, color: isListening ? '#dc2626' : 'inherit'}} title={isListening ? 'Listening... click to stop' : 'Click to speak'}></i></p>
            {isListening && <p style={{color:'#dc2626', fontSize:13, fontWeight:600, marginTop:2}}>🎙️ Listening...</p>}
            <textarea
              className="tabhai"
              style={styles.textarea}
              onFocus={() => {
                setSubCategory("");
              }}
              value={query}
              onBlur={handleBlur}
              onChange={handleInputChange}
              placeholder="Describe your issue..."
              rows={1}
            ></textarea>
            <ul style={styles.suggestionList}>
              {filteredSuggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="sugg1"
                  style={styles.suggestionItem}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.details}
                </li>
              ))}
            </ul>
           
            {/* Bind the value of datetime-local input to the state */}
            <p className="it2" disabled={isDisabled}>
              Incident Time
            </p>
            <input
              className="datel"
              type="datetime-local"
              value={datetime}
              disabled={isDisabled}
              onChange={(e) => setDatetime(e.target.value)} // Update the state when the value changes
            />

            <p className="pri1">
              Priority : <span>{severityScore.toFixed(2)}</span>
            </p>

            <div className="buttonTrain">
              <button className="btnS" disabled={isDisabled} onClick={handleSubmitComplaint}>
                Submit
              </button>
              <button className="btnR" disabled={isDisabled} onClick={handleResetForm}>
                Reset
              </button>
            </div>
          </div>
        );
      case "station":
        return (
          <div className="bro1">
            <h2 className="gr1">Grievance Details for Platform</h2>

            <hr />

            <p className="pnrT">Location/Platform</p>
            <input type="text" className="inpS" disabled={isDisabled} />

            <p className="pnrT">
              Upload Complaint <span>(Image/Video)</span>
            </p>
            <input className="filu" type="file" accept="image/*,video/*" onChange={handleFileChange} disabled={isDisabled} />

            <div className="flexCat">
              <div className="tt1">
                <p>Category</p>
                <input type="text" value={predictedCategory ? (predictedCategory === "violence" ? "Violence / Crowded" : predictedCategory.charAt(0).toUpperCase() + predictedCategory.slice(1)) : ""} readOnly disabled={isDisabled} />
              </div>
              <div className="tt1" id="t2">
                <p>Sub Category</p>
                <input type="text" value={subcategory} readOnly disabled={isDisabled} />
              </div>
            </div>

            <p className="gd1">Grievance Description <i className={`fas fa-microphone ${isListening ? 'micActive' : ''}`} onClick={handleVoiceInput} style={{cursor:'pointer', marginLeft:10, color: isListening ? '#dc2626' : 'inherit'}} title={isListening ? 'Listening... click to stop' : 'Click to speak'}></i></p>
            {isListening && <p style={{color:'#dc2626', fontSize:13, fontWeight:600, marginTop:2}}>🎙️ Listening...</p>}
            <textarea
              className="tabhai"
              style={styles.textarea}
              value={query}
              onBlur={handleBlur}
              onChange={handleInputChange}
              placeholder="Describe your issue..."
              rows={1}
              disabled={isDisabled}
            ></textarea>

            <p className="it2">Incident Time</p>
            <input
              className="datel"
              type="datetime-local"
              value={datetime}
              disabled={isDisabled}
              onChange={(e) => setDatetime(e.target.value)}
            />

            <p className="pri1">
              Priority : <span>{severityScore.toFixed(2)}</span>
            </p>

            <div className="buttonTrain">
              <button className="btnS" disabled={isDisabled} onClick={handleSubmitComplaint}>Submit</button>
              <button className="btnR" disabled={isDisabled} onClick={handleResetForm}>Reset</button>
            </div>
          </div>
        );
      case "ticket":
        return (
          <div className="bro1">
            <h2 className="gr1">Grievance Details for Ticket</h2>

            <hr />

            <p className="pnrT">
              Upload Ticket <span>(Image for OCR)</span>
            </p>

            <input className="filu" type="file" accept="image/*" disabled={isDisabled} onChange={async (e) => {
              const selectedFile = e.target.files[0];
              if (!selectedFile) return;
              setIsUploading(true);

              // Try PaddleOCR backend first, then Gemini Vision fallback
              try {
                const formData = new FormData();
                formData.append("image", selectedFile);
                const response = await fetch(API_CONFIG.ML.OCR_EXTRACTION, {
                  method: "POST",
                  body: formData,
                });

                if (!response.ok) throw new Error("PaddleOCR API failed");

                const data = await response.json();
                console.log("OCR Result:", data);
                const info = data["Extracted Information"];
                if (info) {
                  if (info["PNR Numbers"] && info["PNR Numbers"] !== "Not Found") setPnrNo(info["PNR Numbers"]);
                  if (info["Train Number"] && info["Train Number"] !== "Not Found") setTrainNo(info["Train Number"]);
                  if (info["Ticket Number"] && info["Ticket Number"] !== "Not Found") setTicketDetails(info["Ticket Number"]);
                }
                if (data["Detected Text"]) setQuery(data["Detected Text"]);
              } catch (err) {
                console.warn("PaddleOCR failed, trying Gemini Vision OCR...", err);
                try {
                  const geminiOcr = await ocrWithGemini(selectedFile);
                  if (geminiOcr) {
                    if (geminiOcr.pnr_number && geminiOcr.pnr_number !== "Not Found") setPnrNo(geminiOcr.pnr_number);
                    if (geminiOcr.train_number && geminiOcr.train_number !== "Not Found") setTrainNo(geminiOcr.train_number);
                    if (geminiOcr.ticket_number && geminiOcr.ticket_number !== "Not Found") setTicketDetails(geminiOcr.ticket_number);
                    if (geminiOcr.detected_text) setQuery(geminiOcr.detected_text);
                    console.log("Gemini OCR Result:", geminiOcr);
                  }
                } catch (geminiErr) {
                  console.warn("Gemini OCR also failed:", geminiErr);
                  alert("⚠️ Could not extract text from ticket image.");
                }
              } finally {
                setIsUploading(false);
              }
            }} />
            {isUploading && <p style={{color: "var(--material)", fontWeight: 600}}>Extracting ticket details...</p>}

            <p className="pnrT">Ticket PNR</p>
            <input type="text" className="inpS" value={pnrNo} onChange={(e) => setPnrNo(e.target.value)} disabled={isDisabled} />

            <div className="flexCat">
              <div className="tt1">
                <p>Ticket No</p>
                <input type="text" value={ticketDetails} onChange={(e) => setTicketDetails(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="tt1" id="t2">
                <p>Train No</p>
                <input type="text" value={trainNo} onChange={(e) => setTrainNo(e.target.value)} disabled={isDisabled} />
              </div>
            </div>

            <p className="gd1">Grievance Description <i className={`fas fa-microphone ${isListening ? 'micActive' : ''}`} onClick={handleVoiceInput} style={{cursor:'pointer', marginLeft:10, color: isListening ? '#dc2626' : 'inherit'}} title={isListening ? 'Listening... click to stop' : 'Click to speak'}></i></p>
            {isListening && <p style={{color:'#dc2626', fontSize:13, fontWeight:600, marginTop:2}}>🎙️ Listening...</p>}
            <textarea
              className="tabhai"
              style={styles.textarea}
              value={query}
              onBlur={handleBlur}
              onChange={handleInputChange}
              placeholder="Describe your ticket issue..."
              rows={1}
              disabled={isDisabled}
            ></textarea>

            <p className="it2">Incident Time</p>
            <input
              className="datel"
              type="datetime-local"
              value={datetime}
              disabled={isDisabled}
              onChange={(e) => setDatetime(e.target.value)}
            />

            <p className="pri1">
              Priority : <span>{severityScore > 0 ? severityScore.toFixed(2) : "TBD"}</span>
            </p>

            <div className="buttonTrain">
              <button className="btnS" disabled={isDisabled} onClick={() => {
                if (!predictedCategory) setPredictedCategory("ticketing issue");
                if (!subcategory) setSubCategory("Wrong Ticket");
                handleSubmitComplaint();
              }}>Submit</button>
              <button className="btnR" disabled={isDisabled} onClick={handleResetForm}>Reset</button>
            </div>
          </div>
        );
      case "track":
        return (
          <div>
            {compData && (
              <select
                className="filterUB"
                name="filter"
                onChange={(e) => filterB(e.target.value)}
              >
                <option value="EF">Early First</option>
                <option value="RF">Recent First</option>
                <option value="SE">Severity</option>
                <option value="ST">Status</option>
              </select>
            )}

            {compData && (
              <div className="complaintsData broo2 broo5">
                {compData.length > 0 ? (
                  <ul>
                    {compData.map((complaint) => (
                      <div
                        key={complaint._id}
                        className="staffCompH broo3 broo6 compCard"
                        onClick={() => handleComplaintCardClick(complaint)}
                        style={{cursor: 'pointer'}}
                      >
                        <div className="compCardTop">
                          <span className={`compStatusBadge compStatus${complaint.status?.replace(/\s/g,'') || 'Pending'}`}>
                            {complaint.status || "Pending"}
                          </span>
                          <span className="compSeverityBadge">
                            Sev: {complaint.severity ? Number(complaint.severity).toFixed(1) : "N/A"}
                          </span>
                        </div>
                        <p className="compCardDetails">
                          <strong>{complaint.details}</strong>
                        </p>
                        <p className="compCardMeta">
                          <span className="compCardCat">{complaint.category ? (complaint.category === "violence" ? "Violence / Crowded" : complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)) : "N/A"}</span>
                          {complaint.subcategory && <span className="compCardSub"> &bull; {complaint.subcategory}</span>}
                        </p>
                        <p className="compCardTime">
                          <i className="fas fa-clock"></i> {complaint.startTime}
                        </p>
                        {complaint.staffName && (
                          <p className="compCardStaff">
                            <i className="fas fa-user-tie"></i> Assigned: {complaint.staffName} ({complaint.staffDept || complaint.dept})
                          </p>
                        )}
                        {complaint.staff2Name && (
                          <p className="compCardStaff">
                            <i className="fas fa-user-tie"></i> Cross-Dept: {complaint.staff2Name} ({complaint.staff2Dept || complaint.dept2})
                          </p>
                        )}
                        {!complaint.staffName && (
                          <p className="compCardStaff">
                            <i className="fas fa-building"></i> Dept: {complaint.dept}
                          </p>
                        )}
                        {complaint.media && (
                          <div className="compCardMediaPreview">
                            {complaint.media.match(/\.(mp4|webm|ogg)$/i) ? (
                              <video src={getMediaUrl(complaint.media)} height={60} muted style={{borderRadius:6, cursor:'pointer'}} onClick={() => handleMediaClick(complaint.media)} />
                            ) : (
                              <img src={getMediaUrl(complaint.media)} alt="media" style={{height:60, borderRadius:6, cursor:'pointer'}} onClick={() => handleMediaClick(complaint.media)} />
                            )}
                            <button className="compCardMediaBtn" onClick={() => handleMediaClick(complaint.media)}>
                              <i className="fas fa-image"></i> View Media
                            </button>
                          </div>
                        )}
                        <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:6}}>
                        {complaint.status === "Completed" &&
                          !complaint.feedback && (
                            <button className="compCardMediaBtn" style={{background:'rgba(59,130,246,0.2)', color:'#60a5fa', borderColor:'rgba(59,130,246,0.3)'}} onClick={() => handleFeedback(complaint)}>
                              Give Feedback
                            </button>
                          )}
                        {complaint.status === "Pending" && (
                          <button
                            className="compCardMediaBtn" style={{background:'rgba(239,68,68,0.2)', color:'#f87171', borderColor:'rgba(239,68,68,0.3)'}}
                            onClick={() => handleDeleteComplaint(complaint._id)}
                          >
                            Delete
                          </button>
                        )}
                        {complaint.status === "Completed" && (
                          <button
                            className="compCardMediaBtn" style={{background:'rgba(245,158,11,0.2)', color:'#fbbf24', borderColor:'rgba(245,158,11,0.3)'}}
                            onClick={() => handleReportComp(complaint._id)}
                          >
                            Report
                          </button>
                        )}
                        {/* Reraise Complaint Logic */}
                        {(() => {
                          const currentTime = new Date();
                          const complaintTime = new Date(
                            complaint.startTime.replace(
                              /(\d+)\/(\d+)\/(\d+)/,
                              "$2/$1/$3"
                            )
                          );
                          const timeDifference =
                            (currentTime - complaintTime) / (1000 * 60);

                          if (
                            timeDifference > 30 &&
                            complaint.status == "Pending"
                          ) {
                            return (
                              <button
                                className="compCardMediaBtn" style={{background:'rgba(168,85,247,0.2)', color:'#c084fc', borderColor:'rgba(168,85,247,0.3)'}}
                                onClick={() =>
                                  handleReraiseComplaint(complaint._id)
                                }
                              >
                                Reraise
                              </button>
                            );
                          }
                          return null;
                        })()}
                        </div>
                        {complaint.feedback && (
                          <div className="compCardFeedback">
                            <i className="fas fa-comment"></i> Feedback: {complaint.feedback} {complaint.rating && <span>| Rating: {"⭐".repeat(complaint.rating)}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </ul>
                ) : (
                  <p>No complaints data available</p>
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="fbtn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  ◀️ Previous
                </button>

                <div className="bichwala">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={currentPage === index + 1 ? "activeH" : ""}
                      id="cbtn"
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <button
                  className="fbtn2"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next ▶️
                </button>
              </div>
            )}
            {/* Media Popup */}
            {selectedMedia && (
              <div className="popup1">
                <div className="popup-content1">
                  <span className="close1" onClick={closePopup}>
                    &times;
                  </span>
                  {getMediaType(selectedMedia) === "video" ? (
                    <video controls>
                      <source src={selectedMedia} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img src={selectedMedia} alt="Complaint Media" />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return <p>Select an option to see content.</p>;
    }
  };

  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
      margin: "50px auto",
      maxWidth: "400px",
    },
    textarea: {
      width: "100%",
      padding: "10px",
      fontSize: "16px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      minHeight: "100px",
    },
    suggestionList: {
      listStyle: "none",
      padding: "0",
      margin: "10px 0 0",
      border: "1px solid #ddd",
      maxHeight: "150px",
      overflowY: "auto",
    },
    suggestionItem: {
      padding: "8px",
      cursor: "pointer",
      backgroundColor: "#fff",
    },
    suggestionItemHover: {
      backgroundColor: "#eee",
    },
  };

  const [selectedMedia, setSelectedMedia] = useState(null);

  // Media Popup Handlers
  const ML_SERVER = API_CONFIG.ML_API;
  const handleMediaClick = (media) => {
    const url = media.startsWith("http") ? media : `${ML_SERVER}${media}`;
    setSelectedMedia(url);
  };

  const closePopup = () => {
    setSelectedMedia(null);
  };

  const handleComplaintCardClick = (complaint) => {
    setSelectedComplaintDetail(complaint);
  };

  const closeComplaintDetail = () => {
    setSelectedComplaintDetail(null);
  };

  const getMediaType = (url) => {
    const videoExtensions = ["mp4", "webm", "ogg"];
    const fileExtension = url.split(".").pop().toLowerCase();
    return videoExtensions.includes(fileExtension) ? "video" : "image";
  };

  const handleReraiseComplaint = async (complaintId) => {
    try {
      // Sending a POST request to your backend to re-raise the complaint
      const response = await axios.post(
        "http://localhost:3002/user/reraisecomp",
        {
          complaintId: complaintId,
        }
      );

      // Handle successful response
      alert(response.data.message); // Show success message
      setActiveTab("train");
    } catch (error) {
      // Handle error
      alert(
        error.response
          ? error.response.data.message
          : "Error re-raising complaint"
      );
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("userId");
    localStorage.removeItem("userType");
  };

  return (
    <>
      {loading && <div className="loaderOverlay"><div className="loader"></div></div>}
      <div className="topBar">
        <div className="flexEle">
          <img className="logoS1" src={satyaj} alt="" />
          <img src={railmadadl} alt="" className="logoS2" />
          <img src={g20l} alt="" className="logoS3" />
          <div className="railTB">
            <img src={railsahl} alt="" />
            <p>For Enquiry, Assistance & Grievance Redressal</p>
          </div>
          <div className="emergC" onClick={() => {
            if (!isAuthenticated) {
              alert("⚠️ Please login for Emergency Complaints.");
            } else {
              setShowEmergency(!showEmergency);
            }
          }}>
            <img src={emergencyC} className="logoS4" alt="" />
            <p>For Emergency Complaint</p>
          </div>
          <div className="authOptions">
            {!isAuthenticated && (
              <button
                className="loginBtn broSl"
                onClick={() => setPopupType("login")}
              >
                Log In
              </button>
            )}

            {!isAuthenticated && (
              <button
                className="signBtn broSi"
                onClick={() => setPopupType("register")}
              >
                Sign Up
              </button>
            )}

            {isAuthenticated && (
              <button className="signBtn" onClick={() => setPopupType("userp")}>
                <i className="fas fa-user"></i>
              </button>
            )}

            {isAuthenticated && (
              <i
                class="fa-solid fa-power-off"
                onClick={() => {
                  handleLogout();
                }}
                id="logoutU"
              ></i>
            )}
          </div>
          <select name="language" id="selLang">
            <option value="english">English</option>
            <option value="hindi">हिन्दी</option>
            <option value="bengali">বাংলা</option>
            <option value="marathi">मराठी</option>
            <option value="gujarati">ગુજરાતી</option>
            <option value="kannada">ಕನ್ನಡ</option>
            <option value="malayalam">മലയാളം</option>
            <option value="punjabi">ਪੰਜਾਬੀ</option>
            <option value="odia">ଓଡ଼ିଆ</option>
            <option value="sanskrit">संस्कृत</option>
            <option value="tamil">தமிழ்</option>
            <option value="telugu">తెలుగు</option>
            <option value="urdu">اردو</option>
          </select>
        </div>
      </div>

      <div className="flexC">
        <div className="redirectIcons">
          <div className="flext">
            <div className="f1">
              <img src={f1} alt="" />
              <p>Ticket Booking</p>
            </div>
            <div className="f1">
              <img src={f2} alt="" />
              <p>Train Enquiry</p>
            </div>
          </div>
          <div className="flext">
            <div className="f1">
              <img src={f3} alt="" />
              <p>Reservation Enquiry</p>
            </div>
            <div className="f1">
              <img src={f4} alt="" />
              <p>Retiring Room Booking</p>
            </div>
          </div>
          <div className="flext">
            <div className="f1">
              <img src={f5} alt="" />
              <p>Indian Railway</p>
            </div>
            <div className="f1">
              <img src={f6} alt="" />
              <p>UTS Ticketing</p>
            </div>
          </div>
          <div className="flext">
            <div className="f1">
              <img src={f7} alt="" />
              <p>Raiway Parcel Website</p>
            </div>
            <div className="f1">
              <img src={f8} alt="" />
              <p>Freight Booking</p>
            </div>
          </div>
        </div>

        <div
          className="compOptions"
          style={{
            pointerEvents: "auto",
            opacity: isAuthenticated ? 1 : 0.85,
          }}
        >
          <div
            className={`trainC ${activeTab === "train" ? "active" : ""}`}
            onClick={() => {
              if (!isAuthenticated) {
                alert("⚠️ You need to be Login to access this option.");
              } else {
                setActiveTab("train");
              }
            }}
          >
            <img src={trainI} alt="" />
            <p>Train</p>
          </div>
          <div
            className={`trainC ${activeTab === "station" ? "active" : ""}`}
            onClick={() => {
              if (!isAuthenticated) {
                alert("⚠️ You need to be Login to access this option.");
              } else {
                setActiveTab("station");
              }
            }}
          >
            <img src={stationI} alt="" />
            <p>Station</p>
          </div>
          <div
            className={`trainC ${activeTab === "ticket" ? "active" : ""}`}
            onClick={() => {
              if (!isAuthenticated) {
                alert("⚠️ You need to be Login to access this option.");
              } else {
                setActiveTab("ticket");
              }
            }}
          >
            <img src={ticketI} alt="" />
            <p>Ticket</p>
          </div>
          <div
            className={`trainC trainC0 ${
              activeTab === "track" ? "active" : ""
            }`}
            onClick={() => {
              if (!isAuthenticated) {
                alert("⚠️ You need to be Login to access this option.");
              } else {
                setCurrentPage(1);
                fetchComplaintData();
                setActiveTab("track");
              }
            }}
          >
            <img src={trackI} alt="" />
            <p>Track Complaints</p>
          </div>
        </div>

        <div className="compBox">{renderContent()}</div>
      </div>

      <Popup show={popupType !== null} onClose={handlePopupClose}>
        {popupType === "login" && (
          <Login
            setIsAuthenticated={setIsAuthenticated}
            setUserData={setUserData}
            handlePopupClose={handlePopupClose}
          />
        )}
        {popupType === "register" && (
          <Register onClose={handlePopupClose} setPopupType={setPopupType} />
        )}
        {popupType === "feedback" && selectedComplaint && (
          <UserFeedback
            complaintD={selectedComplaint}
            handlePopupClose={handlePopupClose}
            setActiveTab={setActiveTab}
          />
        )}
        {popupType === "userp" && userData && (
          <UserProfile
            userData={userData}
            handlePopupClose={handlePopupClose}
            setActiveTab={setActiveTab}
          />
        )}
      </Popup>

      {/* Complaint Detail Modal */}
      {selectedComplaintDetail && (
        <div className="emergencyOverlay" onClick={(e) => { if (e.target.className === 'emergencyOverlay') closeComplaintDetail(); }}>
          <div className="complaintDetailModal">
            <div className="complaintDetailHeader">
              <h2>Complaint Details</h2>
              <button className="emergencyClose" onClick={closeComplaintDetail}>&times;</button>
            </div>
            <div className="complaintDetailBody">
              <div className="detailRow">
                <span className={`compStatusBadge compStatus${selectedComplaintDetail.status?.replace(/\s/g,'') || 'Pending'}`}>
                  {selectedComplaintDetail.status || "Pending"}
                </span>
                <span className="compSeverityBadge">
                  Severity: {selectedComplaintDetail.severity ? Number(selectedComplaintDetail.severity).toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="detailRow">
                <strong>Category:</strong> 
                <span>{selectedComplaintDetail.category === "violence" ? "Violence / Crowded" : selectedComplaintDetail.category?.charAt(0).toUpperCase() + selectedComplaintDetail.category?.slice(1)}</span>
              </div>
              {selectedComplaintDetail.subcategory && (
                <div className="detailRow">
                  <strong>Subcategory:</strong> <span>{selectedComplaintDetail.subcategory}</span>
                </div>
              )}
              <div className="detailRow">
                <strong>Details:</strong> <span>{selectedComplaintDetail.details || "No additional details"}</span>
              </div>
              <div className="detailRow">
                <strong>Time:</strong> <span>{selectedComplaintDetail.startTime}</span>
              </div>
              {selectedComplaintDetail.staffName && (
                <div className="detailRow">
                  <strong>Assigned Staff:</strong> <span>{selectedComplaintDetail.staffName} ({selectedComplaintDetail.staffDept || selectedComplaintDetail.dept})</span>
                </div>
              )}
              {selectedComplaintDetail.staff2Name && (
                <div className="detailRow">
                  <strong>Cross-Dept Staff:</strong> <span>{selectedComplaintDetail.staff2Name} ({selectedComplaintDetail.staff2Dept})</span>
                </div>
              )}
              <div className="detailRow">
                <strong>Department:</strong> <span>{selectedComplaintDetail.dept}{selectedComplaintDetail.dept2 ? ` / ${selectedComplaintDetail.dept2}` : ""}</span>
              </div>
              {selectedComplaintDetail.media && (
                <div className="detailRow mediaRow">
                  <strong>Media:</strong>
                  <div className="detailMediaPreview">
                    {selectedComplaintDetail.media.match(/\\.(mp4|webm|ogg)$/i) ? (
                      <video src={getMediaUrl(selectedComplaintDetail.media)} controls style={{maxWidth:'100%', maxHeight:300, borderRadius:8}} />
                    ) : (
                      <img src={getMediaUrl(selectedComplaintDetail.media)} alt="media" style={{maxWidth:'100%', maxHeight:300, borderRadius:8}} />
                    )}
                  </div>
                </div>
              )}
              {selectedComplaintDetail.feedback && (
                <div className="detailRow">
                  <strong>Feedback:</strong> 
                  <span>{selectedComplaintDetail.feedback} {selectedComplaintDetail.rating && `| ${"⭐".repeat(selectedComplaintDetail.rating)}`}</span>
                </div>
              )}
              <div className="complaintDetailActions">
                {selectedComplaintDetail.status === "Completed" && !selectedComplaintDetail.feedback && (
                  <button className="detailActionBtn btnFeedback" onClick={(e) => { e.stopPropagation(); handleFeedback(selectedComplaintDetail); closeComplaintDetail(); }}>
                    <i className="fas fa-comment"></i> Give Feedback
                  </button>
                )}
                {selectedComplaintDetail.status === "Pending" && (
                  <button className="detailActionBtn btnDelete" onClick={(e) => { e.stopPropagation(); handleDeleteComplaint(selectedComplaintDetail._id); closeComplaintDetail(); }}>
                    <i className="fas fa-trash"></i> Delete
                  </button>
                )}
                {selectedComplaintDetail.status === "Completed" && (
                  <button className="detailActionBtn btnReport" onClick={(e) => { e.stopPropagation(); handleReportComp(selectedComplaintDetail._id); closeComplaintDetail(); }}>
                    <i className="fas fa-flag"></i> Report
                  </button>
                )}
                {(() => {
                  const currentTime = new Date();
                  const complaintTime = new Date(
                    selectedComplaintDetail.startTime.replace(/(\d+)\/(\d+)\/(\d+)/, "$2/$1/$3")
                  );
                  const timeDifference = (currentTime - complaintTime) / (1000 * 60);
                  if (timeDifference > 30 && selectedComplaintDetail.status == "Pending") {
                    return (
                      <button className="detailActionBtn btnReraise" onClick={(e) => { e.stopPropagation(); handleReraiseComplaint(selectedComplaintDetail._id); closeComplaintDetail(); }}>
                        <i className="fas fa-redo"></i> Reraise
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Choice Modal - ML vs LLM disagree */}
      {showCategoryChoice && (
        <div className="emergencyOverlay">
          <div className="emergencyModal" style={{maxWidth:480}}>
            <div className="emergencyHeader">
              <div className="emergencyHeaderLeft">
                <span className="emergencyBadge" style={{background:'#3b82f6'}}>VERIFY</span>
                <h2 style={{fontSize:16}}>Category Mismatch</h2>
              </div>
              <button className="emergencyClose" onClick={() => { setShowCategoryChoice(false); }}>&times;</button>
            </div>
            <div className="emergencyBody">
              <p style={{color:'#94a3b8', marginBottom:16, fontSize:14}}>Our ML model and AI verification predicted different categories. Please select the correct one:</p>
              <div className="emergencyBtnGrid">
                <button className="emergencyBtn" style={{background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', color:'#60a5fa'}} onClick={() => {
                  setPredictedCategory(categoryChoices.ml.category);
                  if (categoryChoices.ml.subcategory) setSubCategory(categoryChoices.ml.subcategory);
                  setShowCategoryChoice(false);
                }}>
                  <i className="fas fa-robot"></i>
                  <span style={{display:'block', fontWeight:700, fontSize:15}}>{categoryChoices.ml?.category?.charAt(0).toUpperCase() + categoryChoices.ml?.category?.slice(1)}</span>
                  <span style={{fontSize:12, opacity:0.8}}>{categoryChoices.ml?.subcategory || ""}</span>
                  <span style={{fontSize:11, opacity:0.6}}>ML Model</span>
                </button>
                <button className="emergencyBtn" style={{background:'rgba(168,85,247,0.15)', border:'1px solid rgba(168,85,247,0.3)', color:'#c084fc'}} onClick={() => {
                  setPredictedCategory(categoryChoices.llm.category);
                  if (categoryChoices.llm.subcategory) setSubCategory(categoryChoices.llm.subcategory);
                  setShowCategoryChoice(false);
                }}>
                  <i className="fas fa-brain"></i>
                  <span style={{display:'block', fontWeight:700, fontSize:15}}>{categoryChoices.llm?.category?.charAt(0).toUpperCase() + categoryChoices.llm?.category?.slice(1)}</span>
                  <span style={{fontSize:12, opacity:0.8}}>{categoryChoices.llm?.subcategory || ""}</span>
                  <span style={{fontSize:11, opacity:0.6}}>AI Verification</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Complaint Modal */}
      {showEmergency && (
        <div className="emergencyOverlay">
          <div className="emergencyModal">
            <div className="emergencyHeader">
              <div className="emergencyHeaderLeft">
                <span className="emergencyBadge">EMERGENCY</span>
                <h2>Emergency Complaint</h2>
              </div>
              <button className="emergencyClose" onClick={() => setShowEmergency(false)}>&times;</button>
            </div>
            <div className="emergencyBody">
              <div className="emergencyInfo">
                <div className="emergencyInfoItem">
                  <i className="fas fa-phone-alt"></i>
                  <div>
                    <p className="emergencyLabel">Railway Helpline</p>
                    <p className="emergencyValue">139</p>
                  </div>
                </div>
                <div className="emergencyInfoItem">
                  <i className="fas fa-shield-alt"></i>
                  <div>
                    <p className="emergencyLabel">RPF Emergency</p>
                    <p className="emergencyValue">182</p>
                  </div>
                </div>
                <div className="emergencyInfoItem">
                  <i className="fas fa-ambulance"></i>
                  <div>
                    <p className="emergencyLabel">Medical Emergency</p>
                    <p className="emergencyValue">108</p>
                  </div>
                </div>
              </div>

              <div className="emergencyActions">
                <h3>Quick Emergency Actions</h3>
                <div className="emergencyBtnGrid">
                  <button className="emergencyBtn emergencyBtnDanger" onClick={() => {
                    setPredictedCategory("security");
                    setSubCategory("Theft");
                    setSeverityScore(9.5);
                    setQuery("Emergency: Security threat on train");
                    setShowEmergency(false);
                    setActiveTab("train");
                    setTimeout(() => handleSubmitComplaint(), 500);
                  }}>
                    <i className="fas fa-exclamation-triangle"></i>
                    Security Threat
                  </button>
                  <button className="emergencyBtn emergencyBtnMedical" onClick={() => {
                    setPredictedCategory("medical");
                    setSubCategory("Medical Assistance");
                    setSeverityScore(10);
                    setQuery("Emergency: Medical assistance required urgently");
                    setShowEmergency(false);
                    setActiveTab("train");
                    setTimeout(() => handleSubmitComplaint(), 500);
                  }}>
                    <i className="fas fa-medkit"></i>
                    Medical Emergency
                  </button>
                  <button className="emergencyBtn emergencyBtnViolence" onClick={() => {
                    setPredictedCategory("violence");
                    setSubCategory("Passenger Violence");
                    setSeverityScore(9);
                    setQuery("Emergency: Violence/harassment incident");
                    setShowEmergency(false);
                    setActiveTab("train");
                    setTimeout(() => handleSubmitComplaint(), 500);
                  }}>
                    <i className="fas fa-hand-rock"></i>
                    Violence / Harassment
                  </button>
                  <button className="emergencyBtn emergencyBtnFire" onClick={() => {
                    setPredictedCategory("security");
                    setSubCategory("Unauthorized Entry");
                    setSeverityScore(10);
                    setQuery("Emergency: Fire/smoke detected in train");
                    setShowEmergency(false);
                    setActiveTab("train");
                    setTimeout(() => handleSubmitComplaint(), 500);
                  }}>
                    <i className="fas fa-fire"></i>
                    Fire Emergency
                  </button>
                </div>

                <h3 style={{marginTop: "20px"}}>Video Call Support (WebRTC)</h3>
                <div className="emergencyVideoSection">
                  <p>Connect with railway authorities via live video for urgent issues.</p>
                  <button className="emergencyBtn emergencyBtnVideo" onClick={() => {
                    window.open("http://localhost:8081/", "_blank");
                  }}>
                    <i className="fas fa-video"></i>
                    Start Video Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
