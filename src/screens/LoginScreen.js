import {
  Alert,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/core'
import React, { useEffect, useState, useContext } from 'react'
import * as SQLite from 'expo-sqlite'
import { useRoute } from '@react-navigation/native'
import { UserContext } from '../UserContext'

function openDatabase() {
  if (Platform.OS === 'web') {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        }
      },
    }
  }

  const db = SQLite.openDatabase('db.db')
  return db
}

const db = openDatabase()

const LoginScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { userId, setUserId, userEmail, setUserEmail } = useContext(UserContext)

  const navigation = useNavigation()

  useEffect(() => {
    try {
      db.transaction((tx) => {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, password TEXT)',
          [],
          () => {},
          (_, error) => {
            Alert.alert('Error', 'Error creating users table')
          }
        )
      })
    } catch (error) {
      Alert.alert('Error', 'Error opening database')
    }
  }, [])

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }

    if (!db) {
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password],
        (_, { rows }) => {
          if (rows.length > 0) {
            const results = rows._array
            results.map((user) => {
              setUserId(user.id)
              setUserEmail(user.email)
            })

            navigation.push('BottomNavbar', {
              screen: 'Dashboard',
            })
          } else {
            Alert.alert('Error', 'Invalid credentials')
          }
        },
        (_, error) => {
          Alert.alert('Error', 'Error executing login query')
        }
      )
    })
  }

  const handleRegister = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }

    if (!db) {
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (_, { rows }) => {
          if (rows.length > 0) {
            Alert.alert('Error', 'User already exists')
          } else {
            tx.executeSql(
              'INSERT INTO users (email, password) VALUES (?, ?)',
              [email, password],
              (_, { rowsAffected }) => {
                if (rowsAffected > 0) {
                  Alert.alert('Success', `${email} registered successfully.`)
                } else {
                  Alert.alert('Error', 'Error executing registration query')
                }
              },
              (_, error) => {
                Alert.alert('Error', 'Error executing registration query')
              }
            )
          }
        },
        (_, error) => {
          Alert.alert('Error', 'Error executing select query')
        }
      )
    })
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={(text) => setPassword(text)}
          style={styles.input}
          secureTextEntry
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleLogin} style={styles.button}>
          <Text style={[styles.buttonText]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleRegister}
          style={[styles.button, styles.buttonOutline]}
        >
          <Text style={styles.buttonOutlineText}>Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    width: '80%',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  buttonContainer: {
    width: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  button: {
    backgroundColor: '#0782F9',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonOutline: {
    backgroundColor: 'white',
    marginTop: 5,
    borderColor: '#0782F9',
    borderWidth: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonOutlineText: {
    color: '#0782F9',
    fontWeight: '700',
    fontSize: 16,
  },
})
