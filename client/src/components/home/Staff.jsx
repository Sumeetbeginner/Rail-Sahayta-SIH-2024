import { useState, useEffect } from "react";
import satyaj from "../../assets/icons/satyamevl.webp";
import railmadadl from "../../assets/icons/railmadadl.png";
import g20l from "../../assets/icons/g20l.png";
import railsahl from "../../assets/icons/railsahl.png";
import emergencyC from "../../assets/icons/emergC.png";
import StaffProfile from "./StaffProfile";
import Popup from "./Popup";
import StaffLogin from "../auth/StaffLogin";
import axios from "axios";
import { getMediaUrl } from "../../config/api.js";
import StaffComplaint from "./StaffComplaint";
import StaffCookies from "./StaffCookies";

const Staff = () => {
  const [popupType, setPopupType] = useState(null); // Default to "login" popup
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  const [compView, setCompView] = useState("assigned");
  const [activePage, setActivePage] = useState("complaints");
  const [currComp, setCurrComp] = useState(null);
  const [cookies, setCookies] = useState(null);
  const [staffId1, setStaffId1] = useState(localStorage.getItem('userId'))
  const [selectedComplaintDetail, setSelectedComplaintDetail] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    setStaffId1(userId);
    fetchCookiesDetails();
  }, [staffId1]);

  useEffect(() => {
    const handleStorageChange = () => {
      const userId = localStorage.getItem('userId');
      if (userId && userId !== staffId1) {
        setStaffId1(userId);
      }
    };

    // Listen for changes to localStorage
    window.addEventListener('storage', handleStorageChange);

    // Check for updates on component mount
    handleStorageChange();

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [staffId1]);


  const fetchCookiesDetails = async () => {
    try {
      const staffId = localStorage.getItem("userId");
      console.log(`${staffId} : staffId`);
      
      const response = await axios.post(
        "http://localhost:3002/staff/getcookiesdept",
        { staffId }
      );
      setCookies(response.data.cookies); // Update cookies state with the response data
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (compView == "assigned") {
      fetchAssignedComplaints();
    } else {
      fetchFinishedComp();
    }
  }, [compView, staffId1]);

  const fetchAssignedComplaints = async () => {
    try {
      const staffId = localStorage.getItem("userId");
      const response = await axios.post(
        "http://localhost:3002/staff/assignedcomp",
        { staffId }
      );

      console.log(response.data);

      const sortedComplaints = response.data.assignedComplaints.sort(
        (a, b) => b.severity - a.severity
      ); // Sort by severity

      setCurrComp(sortedComplaints);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchFinishedComp = async () => {
    try {
      const staffId = localStorage.getItem("userId");
      const response = await axios.post(
        "http://localhost:3002/staff/solvedcomp",
        { staffId }
      );

      console.log(response.data);

      setCurrComp(response.data.solvedComp);
    } catch (err) {
      console.log(err);
    }
  };

  const handleCompletedComp = () => {
    setCompView("completed")
    fetchFinishedComp()
  };
  const handleInProcess = () => {
    setCompView("assigned")
    fetchAssignedComplaints()
  };



  useEffect(() => {
    console.log(currComp);
  }, [currComp]);

  useEffect(() => {
    console.log(compView);
  }, [compView]);

  useEffect(() => {
    const validateUser = async () => {
      const userId = localStorage.getItem("userId");
      let userType = localStorage.getItem("userType");

      userType = "staff";

      if (userId && userType) {
        try {
          const response = await axios.post(
            "http://localhost:3002/auth/fetchuserdata",
            {
              userId,
              userType: "staff",
            }
          );

          if (response.status === 200) {
            setIsAuthenticated(true);
            setUserData(response.data.userData); // Store user data if needed
          } else {
            setIsAuthenticated(false);
            setPopupType("login");
            localStorage.removeItem("userId");
            localStorage.removeItem("userType");
          }
        } catch (error) {
          console.error("Error validating user:", error);
          setIsAuthenticated(false);
          setPopupType("login");
          localStorage.removeItem("userId");
          localStorage.removeItem("userType");
        }
      } else {
        setPopupType("login");
        setIsAuthenticated(false);
      }
    };

    validateUser();
  }, []);

  useEffect(() => {
    console.log(userData);
  }, [userData]);

  const handlePopupClose = () => {
    if (popupType === "login" && !isAuthenticated) {
      return; // Prevent closing if login is incomplete
    }
    setPopupType(null);
  };

  const openFinComp = () => {
    setCompView("completed");
  };

  const openAssComp = () => {
    setCompView("assigned");
  };

  const removeCookieFromState = (cookieId) => {
    setCookies((prevCookies) => prevCookies.filter((cookie) => cookie._id !== cookieId));
  };

    return (
      <>
        <div>
          <div className="topBar">
            <div className="flexEle">
              <img className="logoS1" src={satyaj} alt="" />
              <img src={railmadadl} alt="" className="logoS2" />
              <img src={g20l} alt="" className="logoS3" />
              <div className="railTB">
                <img src={railsahl} alt="" />
                <p>For Staff</p>
              </div>
              <div className="emergC">
                <img src={emergencyC} className="logoS4" alt="" />
                <p>For Emergency Issue</p>
              </div>
              <div className="authOptions">
                <button className="loginBtn" id="nj" onClick={() => setPopupType("login")}> 
                  Log In
                </button>
                {isAuthenticated && (
                  <button
                    className="signBtn bhhhh"
                    onClick={() => setPopupType("profile")}
                  >
                    Profile
                  </button>
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

          {/* Staff Navigation */}
          <div className="adminTopNav">
            <button className={`adminNavBtn ${activePage === "complaints" ? "activeNav" : ""}`} onClick={() => setActivePage("complaints")}> 
              <i className="fas fa-clipboard-list"></i> Assigned Complaints
            </button>
            <button className={`adminNavBtn ${activePage === "cookies" ? "activeNav" : ""}`} onClick={() => setActivePage("cookies")}> 
              <i className="fas fa-cookie-bite"></i> Improvements Needed
            </button>
          </div>

          {activePage === "complaints" && (
            <div className="adminFullPage">
              <div className="staffComplaintsPage">
                <div className="pageHeader">
                  <h2>Your Assigned Complaints</h2>
                  <div className="compFilterBtns">
                    <button className={`filterBtn ${compView === "assigned" ? "activeFilter" : ""}`} onClick={openAssComp}> 
                      <i className="fas fa-tasks"></i> Assigned
                    </button>
                    <button className={`filterBtn ${compView === "completed" ? "activeFilter" : ""}`} onClick={openFinComp}> 
                      <i className="fas fa-check-circle"></i> Solved
                    </button>
                  </div>
                </div>
                <div className="complaintsGrid">
                  {currComp && currComp.length > 0 ? (
                    <StaffComplaint complaints={currComp} setCompView={setCompView} onComplete={handleCompletedComp} onProcess={handleInProcess} onComplaintClick={(c) => setSelectedComplaintDetail(c)} />
                  ) : (
                    <p className="noDataMsg">No complaints yet...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activePage === "cookies" && (
            <div className="adminFullPage">
              <div className="staffCookiesPage">
                <div className="pageHeader">
                  <h2>Improvements Needed</h2>
                </div>
                <div className="cookiesContent">
                  {cookies && cookies.length > 0 ? (
                    <StaffCookies cookies={cookies} setCookies={setCookies} onRemove={removeCookieFromState} />
                  ) : (
                    <p className="noDataMsg">No improvement suggestions yet...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Complaint Detail Modal */}
          {selectedComplaintDetail && (
            <div className="emergencyOverlay" onClick={(e) => { if (e.target.className === 'emergencyOverlay') setSelectedComplaintDetail(null); }}>
              <div className="complaintDetailModal">
                <div className="complaintDetailHeader">
                  <h2>Complaint Details</h2>
                  <button className="emergencyClose" onClick={() => setSelectedComplaintDetail(null)}>&times;</button>
                </div>
                <div className="complaintDetailBody">
                  <div className="detailRow">
                    <span className={`compStatusBadge compStatus${selectedComplaintDetail.status?.replace(/\\s/g,'') || 'Pending'}`}>
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
                </div>
              </div>
            </div>
          )}

          {/* Old flexStaffD structure hidden */}
        </div>

        <Popup show={popupType !== null} onClose={handlePopupClose}>
          <>
            {popupType === "login" && (
              <StaffLogin
                setIsAuthenticated={setIsAuthenticated}
                setUserData={setUserData}
                handlePopupClose={handlePopupClose}
                setPopupType={setPopupType}
              />
            )}
            {popupType === "profile" && isAuthenticated && (
              <StaffProfile userData={userData} />
            )}
          </>
        </Popup>
      </>
    );
};

export default Staff;
