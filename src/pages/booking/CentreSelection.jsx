// Dummy list of procurement centres (frontend only, no backend yet)
const centres = [
  {
    id: 1,
    name: 'Village Procurement Centre - Sector 12',
    location: 'Sector 12, Village Road',
    availableSlots: 8,
  },
  {
    id: 2,
    name: 'Agricultural Procurement Centre - Main Road',
    location: 'Main Road, Town Centre',
    availableSlots: 5,
  },
  {
    id: 3,
    name: 'District Procurement Centre - Block A',
    location: 'Block A, District HQ',
    availableSlots: 12,
  },
]

function CentreSelection({ onSelect }) {
  return (
    <div className="centre-list">
      {centres.map((centre) => (
        <div className="centre-card" key={centre.id}>
          <div className="centre-info">
            <h3>{centre.name}</h3>
            <p className="centre-location">📍 {centre.location}</p>
            <p className="centre-slots">{centre.availableSlots} slots available</p>
          </div>
          <button className="select-btn" onClick={() => onSelect(centre)}>
            Select
          </button>
        </div>
      ))}
    </div>
  )
}

export default CentreSelection
