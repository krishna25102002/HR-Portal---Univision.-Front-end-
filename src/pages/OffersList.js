import React, { useEffect, useState } from 'react';
import { candidatesAPI, offersAPI, emailsAPI } from '../api/client';
import { toast } from 'react-toastify';
import '../pages/AnimationsAndStyles.css';

export default function OffersList() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candidatesMap, setCandidatesMap] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const candRes = await candidatesAPI.getAll();
      const candMap = {};
      candRes.data.forEach(c => candMap[c.id] = c);
      setCandidatesMap(candMap);

      // Fetch offers for all candidates
      const allOffers = [];
      for (const candidate of candRes.data) {
        try {
          const offerRes = await offersAPI.getByCandidate(candidate.id);
          allOffers.push(...offerRes.data.map(o => ({ ...o, candidate_id: candidate.id })));
        } catch (error) {
          // Skip if no offers
        }
      }
      setOffers(allOffers);
    } catch (error) {
      toast.error('Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOffer = async (offerId, candidateId) => {
    try {
      await emailsAPI.sendOffer({
        candidate_id: candidateId,
        offer_id: offerId,
        email_service: 'gmail'
      });
      toast.success('Offer email sent');
    } catch (error) {
      toast.error('Failed to send offer');
    }
  };

  return (
    <div className="card">
      <h2>Offers</h2>
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Position</th>
              <th>Salary</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map(offer => (
              <tr key={offer.id}>
                <td>{candidatesMap[offer.candidate_id]?.name || 'Unknown'}</td>
                <td>{offer.position}</td>
                <td>{offer.salary}</td>
                <td>{new Date(offer.start_date).toLocaleDateString()}</td>
                <td><span className={`badge badge-${offer.status}`}>{offer.status}</span></td>
                <td>
                  <button onClick={() => handleSendOffer(offer.id, offer.candidate_id)} className="btn btn-secondary">Send</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
