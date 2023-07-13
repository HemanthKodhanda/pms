import React from 'react'

const UserContext = React.createContext()

const UserProvider = ({ children }) => {
  const [userId, setUserId] = React.useState('')
  const [userEmail, setUserEmail] = React.useState('')
  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        userEmail,
        setUserEmail,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export { UserContext, UserProvider }
