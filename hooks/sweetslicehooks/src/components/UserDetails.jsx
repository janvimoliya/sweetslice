import React from 'react'
import { useContext } from 'react'
import { UserContext } from '../context/UserContext'

const UserDetails = () => {
    const user=useContext(UserContext);
  return (
    
      <div>
        <p>Name : {user.name}</p>
        <p>City : {user.city}</p>
        
      </div>
    
  )
}

export default UserDetails
