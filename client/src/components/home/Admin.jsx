import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import satyaj from "../../assets/icons/satyamevl.webp";
import railmadadl from "../../assets/icons/railmadadl.png";
import g20l from "../../assets/icons/g20l.png";
import railsahl from "../../assets/icons/railsahl.png";
import emergencyC from "../../assets/icons/emergC.png";
import AdminProfile from "./AdminProfile";
import Popup from "./Popup";
import AdminLogin from "../auth/AdminLogin";
import axios from "axios";
import RecurringIssue from "../charts/RecurringIssue.jsx";
import CompCount from "../charts/CompCount.jsx";
import DutyShift from "../charts/dutyShift.jsx";
import ComplaintRR from "../charts/ComplaintRR.jsx";
import ComplaintRR2 from "../charts/ComplaintRR2.jsx";
import StaffAvgRating from "../charts/StaffAvgRating.jsx";
import CategoryDistribution from "../charts/CategoryDistribution.jsx";
import SeverityDistribution from "../charts/SeverityDistribution.jsx";
import StatusTrend from "../charts/StatusTrend.jsx";
import AddStaff from "./AddStaff.jsx";

const Admin = () => {
  const [popupType, setPopupType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showType, setShowType] = useState("staffs");
  const [showData, setShowData] = useState([]);
  const [staffId1, setStaffId1] = useState(localStorage.getItem("userId"));
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [recIssue, setRecIssue] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [compData, setCompData] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedComplaintDetail, setSelectedComplaintDetail] = useState(null);

  useEffect(() => {
    if (showType == "staffs") {
      setStaffData(showData);
    }
  }, [showData]);

  // Update staff ID from localStorage
  useEffect(() => {
    const userId = localStorage.getItem("userId");

    // Fetch initial data
    if (showType == "complaints" && userData) {
      getComplaintsData();
    } else if (showType == "staffs" && userData) {
      getStaffData();
      getComplaintsData();
    }

  }, [localStorage.getItem("userId"), showType, staffId1, userData]);

  const handleStaffAdded = () => {
    getStaffData(); // Refresh the staff data
  };

  const fetchData = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:9898/v1/forecast", {
        department: userData.dept,
      });
      setRecIssue(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userData]);

  // Listen for localStorage changes
  useEffect(() => {
    setStaffId1(localStorage.getItem("userId"));
  }, [localStorage.getItem("userId")]);

  // Validate user on load
  useEffect(() => {
    const validateUser = async () => {
      const userId = localStorage.getItem("userId");
      const userType = "admin"; // Hardcoded, replace with dynamic logic if required

      if (userId && userType) {
        try {
          const response = await axios.post(
            "http://localhost:3002/auth/fetchuserdata",
            {
              userId,
              userType,
            }
          );

          if (response.status === 200) {
            setIsAuthenticated(true);
            setUserData(response.data.userData);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error("Error validating user:", error);
          handleLogout();
        }
      } else {
        handleLogout();
      }
    };

    validateUser();
  }, [localStorage.getItem("userId")]);

  // Handle Logout
  const handleLogout = () => {

    setShowData([])
    setCompData([])
    setStaffData([])
    setIsAuthenticated(false);
    setPopupType("login");
    localStorage.removeItem("userId");
    localStorage.removeItem("userType");
  };

  // Close popup
  const handlePopupClose = () => {
    if (popupType === "login" && !isAuthenticated) return;
    setPopupType(null);
  };

  // Fetch staff data
  const getStaffData = async () => {
    if (!userData || !userData.dept) {
      console.warn("User data or department is not available yet");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3002/admin/getstaffbydept",
        {
          dept: userData.dept,
        }
      );
      setShowData(response.data.staff || []);
      console.log("Fetched Staff Data:", response.data.staff);
    } catch (err) {
      console.error("Error fetching staff data:", err);
    }
  };

  // Fetch complaints data
  const getComplaintsData = async () => {
    if (!userData || !userData.dept) {
      console.warn("User data or department is not available yet");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3002/admin/deptcomp",
        {
          dept: userData.dept,
        }
      );
      if (showType == "complaints") {
        setShowData(response.data.complaints || []);
      }
      setCompData(response.data.complaints || []);
      console.log("Fetched Complaints Data:", response.data.complaints);
    } catch (err) {
      console.error("Error fetching complaints data:", err);
    }
  };

  // Media Popup Handlers
  const ML_SERVER = "http://localhost:9898/v1";
  const handleMediaClick = (media) => {
    const url = media.startsWith("http") ? media : `${ML_SERVER}${media}`;
    setSelectedMedia(url);
  };

  const closePopup = () => {
    setSelectedMedia(null);
  };

  const handleComplaintClick = (complaint) => {
    setSelectedComplaintDetail(complaint);
  };

  const closeComplaintDetail = () => {
    setSelectedComplaintDetail(null);
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await axios.post('http://localhost:3002/staff/updatecompstatus', {
        complaintId,
        status: newStatus,
      });
      // Refresh complaint data
      getComplaintsData();
      // Update the modal data
      if (selectedComplaintDetail && selectedComplaintDetail._id === complaintId) {
        setSelectedComplaintDetail({...selectedComplaintDetail, status: newStatus});
      }
      alert(`✅ Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('⚠️ Failed to update status');
    }
  };

  const getMediaType = (url) => {
    const videoExtensions = ["mp4", "webm", "ogg"];
    const fileExtension = url.split(".").pop().toLowerCase();
    return videoExtensions.includes(fileExtension) ? "video" : "image";
  };

  const [morningCount, setMorningCount] = useState(0);
  const [nightCount, setNightCount] = useState(0);

  useEffect(() => {
    const morning = staffData.filter(
      (staff) => staff.dutyShift === "morning"
    ).length;
    const night = staffData.filter(
      (staff) => staff.dutyShift === "night"
    ).length;

    setMorningCount(morning);
    setNightCount(night);
  }, [staffData]);

  // Capitalize the first letter of each word
  const capitalizeFirstLetter = (str) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const parseCustomDate = (dateString) => {
    const [datePart, timePart] = dateString.split(", ");
    const [day, month, year] = datePart.split("/").map(Number); // Convert to numbers
    const [hours, minutes, seconds] = timePart.split(":").map(Number); // Convert to numbers
    return new Date(year, month - 1, day, hours, minutes, seconds); // Create Date object
  };

  const filterB = (filterType) => {
    if (!Array.isArray(showData)) {
      console.error("showData must be an array");
      return;
    }

    let sortedData = [...showData]; // Copy the array to avoid mutations

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
    if (typeof setShowData === "function") {
      setShowData(sortedData);
    } else {
      console.error("setShowData is not defined or not a function");
    }
  };

  return (
    <div>
      {/* Top Bar */}
      <div className="topBar">
        <div className="flexEle">
          <img className="logoS1" src={satyaj} alt="" />
          <img src={railmadadl} alt="" className="logoS2" />
          <img src={g20l} alt="" className="logoS3" />
          <div className="railTB">
            <img src={railsahl} alt="" />
            <p>For Admin</p>
          </div>
          <div className="emergC">
            <img src={emergencyC} className="logoS4" alt="" />
            <p>For Emergency Issue</p>
          </div>
          <div className="authOptions">
            {!isAuthenticated && (
              <button
                className="loginBtn"
                onClick={() => setPopupType("login")}
              >
                Admin Log In
              </button>
            )}
            {isAuthenticated && (
              <button
                className="signBtn"
                onClick={() => setPopupType("profile")}
              >
                Admin 
              </button>
            )}
            {isAuthenticated && <button className="signBtn" onClick={() => setPopupType("addstaff")}>Add Staff</button>}
          </div>
          <i class="fa-solid fa-power-off" onClick={() => {handleLogout()}} id="logoutAdmin"></i>
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

      {/* Dashboard Content */}
      <div className="adminTopNav">
        <button className={`adminNavBtn ${activePage === "dashboard" ? "activeNav" : ""}`} onClick={() => setActivePage("dashboard")}>
          <i className="fas fa-chart-line"></i> Dashboard
        </button>
        <button className={`adminNavBtn ${activePage === "staff" ? "activeNav" : ""}`} onClick={() => setActivePage("staff")}>
          <i className="fas fa-users"></i> Staff Management
        </button>
        <button className={`adminNavBtn ${activePage === "complaints" ? "activeNav" : ""}`} onClick={() => setActivePage("complaints")}>
          <i className="fas fa-clipboard-list"></i> Complaints
        </button>
      </div>

      {activePage === "dashboard" && (
        <div className="adminFullPage dashboardFullPage">
          <div className="adminDashboard adminDashboardFull">
            <div className="dashboardHeader">
              <div className="dashboardHeaderLeft">
                <h2>Dashboard Overview</h2>
                <p className="dashboardSubtitle">Real-time insights and analytics for {userData?.dept || "All"} Department{userData?.isDeptAdmin ? " (Department Admin)" : " (Admin)"}</p>
              </div>
              <div className="dashboardHeaderRight">
                <div className="dashboardQuickActions">
                  <button className="quickActionBtn" onClick={() => setActivePage("complaints")}>
                    <i className="fas fa-clipboard-list"></i>
                    View All Complaints
                  </button>
                  <button className="quickActionBtn" onClick={() => setActivePage("staff")}>
                    <i className="fas fa-users"></i>
                    Manage Staff
                  </button>
                  <button className="quickActionBtn quickActionBtnPrimary" onClick={() => setPopupType("addstaff")}>
                    <i className="fas fa-user-plus"></i>
                    Add New Staff
                  </button>
                </div>
              </div>
            </div>
          {/* Quick Stats */}
          {userData && (
            <div className="dashStatsRow">
              <div className="dashStat">
                <i className="fas fa-users"></i>
                <div>
                  <span className="dashStatNum">{staffData.length}</span>
                  <span className="dashStatLabel">Staff</span>
                </div>
              </div>
              <div className="dashStat">
                <i className="fas fa-clipboard-list"></i>
                <div>
                  <span className="dashStatNum">{compData.length}</span>
                  <span className="dashStatLabel">Complaints</span>
                </div>
              </div>
              <div className="dashStat">
                <i className="fas fa-check-circle"></i>
                <div>
                  <span className="dashStatNum">{compData.filter(c => c.status === "Completed").length}</span>
                  <span className="dashStatLabel">Resolved</span>
                </div>
              </div>
              <div className="dashStat">
                <i className="fas fa-exclamation-circle"></i>
                <div>
                  <span className="dashStatNum">{compData.filter(c => c.status === "Pending").length}</span>
                  <span className="dashStatLabel">Pending</span>
                </div>
              </div>
              {/* <div className="dashStat">
                <i className="fas fa-spinner"></i>
                <div>
                  <span className="dashStatNum">{compData.filter(c => c.status === "In Process").length}</span>
                  <span className="dashStatLabel">In Process</span>
                </div>
              </div> */}
              {/* <div className="dashStat">
                <i className="fas fa-percentage"></i>
                <div>
                  <span className="dashStatNum">{compData.length > 0 ? Math.round((compData.filter(c => c.status === "Completed").length / compData.length) * 100) : 0}%</span>
                  <span className="dashStatLabel">Resolution</span>
                </div>
              </div> */}
            </div>
          )}
          {/* Feedback Summary */}
          {userData && compData.length > 0 && (
            <div className="dashFeedbackRow">
              <div className="dashStat">
                <i className="fas fa-comments"></i>
                <div>
                  <span className="dashStatNum">{compData.filter(c => c.feedback).length}</span>
                  <span className="dashStatLabel">Feedbacks</span>
                </div>
              </div>
              <div className="dashStat">
                <i className="fas fa-star"></i>
                <div>
                  <span className="dashStatNum">{compData.filter(c => c.rating).length > 0 ? (compData.filter(c => c.rating).reduce((acc, c) => acc + c.rating, 0) / compData.filter(c => c.rating).length).toFixed(1) : "N/A"}</span>
                  <span className="dashStatLabel">Avg Rating</span>
                </div>
              </div>
              <div className="dashStat">
                <i className="fas fa-smile"></i>
                <div>
                  <span className="dashStatNum">{compData.filter(c => c.sentiment === "positive" || c.sentiment === "Positive").length}</span>
                  <span className="dashStatLabel">Positive</span>
                </div>
              </div>
              <div className="dashStat">
                <i className="fas fa-frown"></i>
                <div>
                  <span className="dashStatNum">{compData.filter(c => c.sentiment === "negative" || c.sentiment === "Negative").length}</span>
                  <span className="dashStatLabel">Negative</span>
                </div>
              </div>
            </div>
          )}
          <div className="scrollDB">
            {/* Key Metrics Charts */}
            <div className="chartsGrid">
              <div className="chartRow">
                {compData && compData.length > 0 && <CategoryDistribution complaintsData={compData} />}
                {compData && compData.length > 0 && <SeverityDistribution complaintsData={compData} />}
              </div>
              
              <div className="chartRow">
                {staffData && staffData.length > 0 && <CompCount staffData={staffData} />}
                {staffData && staffData.length > 0 && (
                  <DutyShift
                    morningCount={morningCount}
                    nightCount={nightCount}
                  />
                )}
              </div>

              <div className="chartRowFull">
                {compData && compData.length > 0 && <StatusTrend complaintsData={compData} />}
              </div>

              <div className="chartRowFull">
                {userData && recIssue && (
                  <RecurringIssue chartData={recIssue} department={userData.dept} />
                )}
              </div>

              <div className="chartRow">
                {compData && compData.length > 0 && <ComplaintRR complaintsData={compData} />}
                {compData && compData.length > 0 && <ComplaintRR2 complaintsData={compData} />}
              </div>

              <div className="chartRowFull">
                {staffData && staffData.length > 0 && <StaffAvgRating staffData={staffData} />}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {activePage === "staff" && (
        <div className="adminFullPage">
          <div className="adminStaffPage">
            <div className="pageHeader">
              <h2>Staff Management</h2>
              <button className="btnAddStaff" onClick={() => setPopupType("addstaff")}>
                <i className="fas fa-user-plus"></i> Add New Staff
              </button>
            </div>
            <div className="staffGrid">
              {staffData.length > 0 ? (
                staffData.map((staff, index) => (
                  <div className="staffCard" key={index}>
                    <div className="staffCardHeader">
                      <img src="https://cdn-icons-png.flaticon.com/128/2534/2534879.png" alt="" />
                      <div>
                        <h3>{staff.name}</h3>
                        <p className="staffEmail">{staff.email}</p>
                      </div>
                    </div>
                    <div className="staffCardBody">
                      <div className="staffInfoRow">
                        <span className="staffLabel">Department:</span>
                        <span className="staffValue">{staff.dept}</span>
                      </div>
                      <div className="staffInfoRow">
                        <span className="staffLabel">Duty Shift:</span>
                        <span className="staffValue">
                          {staff.dutyShift === "morning" ? "🌤️" : "🌙"} {staff.dutyShift}
                        </span>
                      </div>
                      <div className="staffInfoRow">
                        <span className="staffLabel">Avg Rating:</span>
                        <span className="staffValue">⭐ {staff.avgRating ? staff.avgRating.toFixed(1) : "N/A"}</span>
                      </div>
                      <div className="staffInfoRow">
                        <span className="staffLabel">Complaints Assigned:</span>
                        <span className="staffValue">{staff.compAssigned?.length || 0}</span>
                      </div>
                      <div className="staffInfoRow">
                        <span className="staffLabel">Complaints Solved:</span>
                        <span className="staffValue">{staff.compSolved?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="noDataMsg">No staff members found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activePage === "complaints" && (
        <div className="adminFullPage">
          <div className="adminComplaintsPage">
            <div className="pageHeader">
              <h2>Complaints Management</h2>
              <select className="filterSelect" onChange={(e) => filterB(e.target.value)}>
                <option value="RF">Recent First</option>
                <option value="EF">Early First</option>
                <option value="SE">Severity</option>
                <option value="ST">Status</option>
              </select>
            </div>
            <div className="complaintsGrid">
              {compData.length > 0 ? (
                compData.map((complaint) => (
                  <div key={complaint._id} className="compCard compCardEnhanced" onClick={() => handleComplaintClick(complaint)}>
                    <div className="compCardHeader">
                      <div className="compCardHeaderLeft">
                        <span className={`compStatusBadge compStatus${complaint.status?.replace(/\\s/g,'') || 'Pending'}`}>
                          <i className={`fas fa-${complaint.status === 'Completed' ? 'check-circle' : complaint.status === 'In Process' ? 'spinner' : 'clock'}`}></i>
                          {complaint.status || "Pending"}
                        </span>
                        <span className={`compSeverityBadge severity${Math.floor(parseFloat(complaint.severity || 0) / 2.5)}`}>
                          <i className="fas fa-exclamation-triangle"></i>
                          Severity: {complaint.severity ? (complaint.severity.toFixed ? complaint.severity.toFixed(1) : complaint.severity) : "N/A"}
                        </span>
                      </div>
                      {complaint.media && (
                        <span className="compMediaIndicator">
                          <i className="fas fa-image"></i>
                        </span>
                      )}
                    </div>
                    <div className="compCardContent">
                      <h3 className="compCardTitle">{complaint.details || complaint.category || "No details"}</h3>
                      <div className="compCardMeta">
                        <span className="compCardCat">
                          <i className="fas fa-tag"></i>
                          {complaint.category ? (complaint.category === "violence" ? "Violence / Crowded" : complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)) : "N/A"}
                        </span>
                        {complaint.subcategory && <span className="compCardSub">&bull; {complaint.subcategory}</span>}
                      </div>
                      <div className="compCardFooter">
                        <p className="compCardTime"><i className="fas fa-clock"></i> {complaint.startTime || "N/A"}</p>
                        {complaint.staffName && (
                          <p className="compCardStaff"><i className="fas fa-user-tie"></i> {complaint.staffName}</p>
                        )}
                        <p className="compCardDept"><i className="fas fa-building"></i> {complaint.dept}{complaint.dept2 ? ` / ${complaint.dept2}` : ""}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="noDataMsg"><i className="fas fa-inbox"></i> No complaints found</p>
              )}
            </div>
          </div>
        </div>
      )}

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
                <strong>Status:</strong>
                <select className="statusChangeSelect" value={selectedComplaintDetail.status || "Pending"} onChange={(e) => handleStatusChange(selectedComplaintDetail._id, e.target.value)} onClick={(e) => e.stopPropagation()}>
                  <option value="Pending">Pending</option>
                  <option value="In Process">In Process</option>
                  <option value="Completed">Completed</option>
                  <option value="Re-Raised">Re-Raised</option>
                </select>
                <span className="compSeverityBadge" style={{marginLeft:10}}>
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
              {selectedComplaintDetail.pnrNo && (
                <div className="detailRow">
                  <strong>PNR:</strong> <span>{selectedComplaintDetail.pnrNo}</span>
                </div>
              )}
              {selectedComplaintDetail.trainNo && (
                <div className="detailRow">
                  <strong>Train No:</strong> <span>{selectedComplaintDetail.trainNo}</span>
                </div>
              )}
              {selectedComplaintDetail.media && (
                <div className="detailRow mediaRow">
                  <strong>Media:</strong>
                  <div className="detailMediaPreview">
                    {selectedComplaintDetail.media.match(/\\.(mp4|webm|ogg)$/i) ? (
                      <video src={`http://localhost:9898/v1${selectedComplaintDetail.media}`} controls style={{maxWidth:'100%', maxHeight:300, borderRadius:8}} />
                    ) : (
                      <img src={`http://localhost:9898/v1${selectedComplaintDetail.media}`} alt="media" style={{maxWidth:'100%', maxHeight:300, borderRadius:8}} />
                    )}
                  </div>
                </div>
              )}
              {selectedComplaintDetail.feedback && (
                <div className="detailRow">
                  <strong>Feedback:</strong> 
                  <div className="feedbackBox">
                    <p>{selectedComplaintDetail.feedback}</p>
                    {selectedComplaintDetail.rating && <p>Rating: {"⭐".repeat(selectedComplaintDetail.rating)}</p>}
                    {selectedComplaintDetail.sentiment && (
                      <span className={`compSentiment compSentiment${selectedComplaintDetail.sentiment}`}>
                        {selectedComplaintDetail.sentiment}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Old flexAdminD structure removed, now using page navigation */}

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

      {/* Popup Component */}
      <Popup show={popupType !== null} onClose={handlePopupClose}>
        {popupType === "login" && !isAuthenticated && (
          <AdminLogin
            setIsAuthenticated={setIsAuthenticated}
            setUserData={setUserData}
            handlePopupClose={handlePopupClose}
            setPopupType={setPopupType}
          />
        )}
        {popupType === "profile" && isAuthenticated && (
          <AdminProfile userData={userData} />
        )}
        {popupType === "addstaff" && isAuthenticated && (
          <AddStaff userData={userData} setShowType={setShowType} handlePopupClose={handlePopupClose} onStaffAdded={handleStaffAdded} />
        )}
      </Popup>
    </div>
  );
};

export default Admin;
