import { StyleSheet, Text, View, Button } from 'react-native'
import React, { useEffect, useState, useContext } from 'react'
import { useRoute } from '@react-navigation/native'
import { UserContext } from '../UserContext'

const DashboardScreen = ({ route, navigation }) => {
  const { userId, setUserId, userEmail, setUserEmail } = useContext(UserContext)
  return (
    <View style={styles.container}>
      <Text>{userEmail}</Text>
    </View>
  )
}

export default DashboardScreen

const styles = StyleSheet.create({})
