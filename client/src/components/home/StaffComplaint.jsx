import React, { useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api.js';

const StaffComplaint = ({ complaints, setCompView , onComplete, onProcess, onComplaintClick}) => {
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Open media popup
  const ML_SERVER = API_CONFIG.ML_API;
  const handleMediaClick = (media) => {
    const url = media.startsWith("http") ? media : `${ML_SERVER}${media}`;
    setSelectedMedia(url);
  };

  // Close media popup
  const closePopup = () => {
    setSelectedMedia(null);
  };

  // Determine media type
  const getMediaType = (url) => {
    const videoExtensions = ['mp4', 'webm', 'ogg'];
    const fileExtension = url.split('.').pop().toLowerCase();
    return videoExtensions.includes(fileExtension) ? 'video' : 'image';
  };

  const capitalizeFirstLetter = (str) => {
    return str
      .split(' ') // Split the string by spaces
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
      .join(' '); // Join the words back together
  };

  const updateStatus = async (complaintId, status) => {
    try {
        const response = await axios.post('http://localhost:3002/staff/updatecompstatus', {
          complaintId,
          status,
        });
        if(status == 'completed'){
            onComplete()
        }
        else{
            onProcess()
        }
        console.log(response);
        
      } catch (error) {
        console.log(error);
      }
  }

  return (
    <div className='brooo'>
      {complaints.map((complaint) => (
        <div className='ath' key={complaint._id}>
        <div className="staffCompH compCard" style={{cursor: onComplaintClick ? 'pointer' : 'default'}} onClick={() => onComplaintClick && onComplaintClick(complaint)}>

          <div className="compCardTop">
            <span className={`compStatusBadge compStatus${complaint.status?.replace(/\s/g,'') || 'Pending'}`}>
              {complaint.status || "Pending"}
            </span>
            {complaint.severity && (
              <span className="compSeverityBadge">
                Sev: {typeof complaint.severity === 'number' && complaint.severity.toFixed ? complaint.severity.toFixed(1) : complaint.severity}
              </span>
            )}
          </div>
          <p className="compCardDetails">{complaint.details || complaint.category || "No details"}</p>
          <p className="compCardMeta">
            <span className="compCardCat">{capitalizeFirstLetter(complaint.category === "violence" ? "Violence / Crowded" : complaint.category)}</span>
            {complaint.subcategory && <span className="compCardSub"> &bull; {complaint.subcategory}</span>}
          </p>
          <p className="compCardTime">
            <i className="fas fa-clock"></i> {complaint.startTime}
          </p>
          <p className="compCardStaff">
            <i className="fas fa-building"></i> Dept: {complaint.dept}{complaint.dept2 ? ` / ${complaint.dept2}` : ""}
          </p>

          {complaint.media && (
            <div className="compCardMediaPreview">
              {complaint.media.match(/\.(mp4|webm|ogg)$/i) ? (
                <video src={`${ML_SERVER}${complaint.media}`} height={50} muted style={{borderRadius:6, cursor:'pointer'}} onClick={(e) => {e.stopPropagation(); handleMediaClick(complaint.media)}} />
              ) : (
                <img src={`${ML_SERVER}${complaint.media}`} alt="media" style={{height:50, borderRadius:6, cursor:'pointer'}} onClick={(e) => {e.stopPropagation(); handleMediaClick(complaint.media)}} />
              )}
            </div>
          )}

          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:4}}>
            {complaint.media && (
              <button className="compCardMediaBtn" onClick={(e) => {e.stopPropagation(); handleMediaClick(complaint.media)}}>
                <i className="fas fa-image"></i> Media
              </button>
            )}
            {(complaint.status === 'Pending' || complaint.status === "Re-Raised") && (
              <button className="compCardMediaBtn" style={{background:'rgba(59,130,246,0.2)', color:'#60a5fa', borderColor:'rgba(59,130,246,0.3)'}} onClick={(e) => {e.stopPropagation(); updateStatus(complaint._id, 'In Process')}}>
                Accept
              </button>
            )}
            {complaint.status === 'In Process' && (
              <button className="compCardMediaBtn" style={{background:'rgba(34,197,94,0.2)', color:'#4ade80', borderColor:'rgba(34,197,94,0.3)'}} onClick={(e) => {e.stopPropagation(); updateStatus(complaint._id, 'Completed')}}>
                Complete
              </button>
            )}
          </div>
        </div>
        <div className='fbbhai'>Feedback : {complaint.feedback || "No Feedback Yet" }</div>
        </div>
      ))}

      {/* Media Popup */}
      {selectedMedia && (
        <div className="popup1">
          <div className="popup-content1">
            <span className="close1" onClick={closePopup}>
              &times;
            </span>
            {getMediaType(selectedMedia) === 'video' ? (
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
};

export default StaffComplaint;
